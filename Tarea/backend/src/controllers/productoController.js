/**
 * Controlador de productos.
 *
 * Implementa listado con filtros, obtención por id, creación, actualización con
 * control ABAC de campos permitidos y eliminación. Incluye logging de auditoría.
 */
const prisma = require('../prisma/client');
const { hasRole } = require('../utils/policyEngine');
const { logAction } = require('../middlewares/logger');

/**
 * Convierte un valor textual a booleano aceptando variantes comunes.
 * @param {any} v
 * @returns {boolean|undefined}
 */
function parseBool(v) {
  if (v === undefined) return undefined;
  return ['true', '1', 'yes'].includes(String(v).toLowerCase());
}

/**
 * Lista productos con filtros opcionales y aislamiento por tienda según rol.
 * - Empleados/Gerentes: solo ven productos de su tienda.
 * - Administradores/Auditores: pueden ver globalmente.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 Producto[], 403 { message }
 */
async function listProductos(req, res) {
  const { tiendaId, esPremium, categoria } = req.query;

  const where = {};
  if (categoria) where.categoria = categoria;
  if (esPremium !== undefined) where.esPremium = parseBool(esPremium);
  if (tiendaId) where.tiendaId = Number(tiendaId);

  const isManagerOrEmployee = hasRole(req.user, 'Gerente') || hasRole(req.user, 'Empleado');
  const isAdminOrAuditor = hasRole(req.user, 'Administrador') || hasRole(req.user, 'Auditor');

  if (isManagerOrEmployee) {
    where.tiendaId = req.user.tiendaId; // DB-level filter to avoid leaks
  } else if (!isAdminOrAuditor) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const productos = await prisma.producto.findMany({
    where,
    orderBy: { id: 'asc' },
  });
  return res.json(productos);
}

/**
 * Devuelve un producto ya cargado por el middleware ABAC `checkAbac('read')`.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 Producto
 */
async function getProducto(req, res) {
  // checkAbac('read') already ran
  return res.json(req.product);
}

/**
 * Crea un nuevo producto validando campos obligatorios y tienda existente.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 201 Producto, 400/500 { message }
 */
async function createProducto(req, res) {
  const { nombre, descripcion, precio, stock, categoria, tiendaId, esPremium } = req.body;
  if (!nombre || precio === undefined || stock === undefined || !categoria || tiendaId === undefined) {
    return res.status(400).json({ message: 'Campos requeridos: nombre, precio, stock, categoria, tiendaId' });
  }
  try {
    const tienda = await prisma.tienda.findUnique({ where: { id: Number(tiendaId) } });
    if (!tienda) return res.status(400).json({ message: 'tiendaId inválido' });

    const p = await prisma.producto.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        precio: Number(precio),
        stock: Number(stock),
        categoria,
        tiendaId: Number(tiendaId),
        esPremium: Boolean(esPremium),
        creadoPorId: req.user.id,
      },
    });
    await logAction(req, 'CREAR_PRODUCTO', `Producto ${p.id}`, 'éxito');
    return res.status(201).json(p);
  } catch (e) {
    return res.status(500).json({ message: 'Error al crear producto' });
  }
}

/**
 * Actualiza campos permitidos de un producto según ABAC.
 * - Los campos válidos vienen en `req.abac.allowedFields`.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 Producto, 400/500 { message }
 */
async function updateProducto(req, res) {
  const allowedFields = (req.abac?.allowedFields) || [];
  const updates = {};
  for (const f of allowedFields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No hay campos válidos para actualizar' });
  }
  try {
    if (updates.precio !== undefined) updates.precio = Number(updates.precio);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    if (updates.tiendaId !== undefined) updates.tiendaId = Number(updates.tiendaId);

    const p = await prisma.producto.update({
      where: { id: req.product.id },
      data: updates,
    });
    await logAction(req, 'ACTUALIZAR_PRODUCTO', `Producto ${p.id}`, 'éxito');
    return res.json(p);
  } catch (e) {
    return res.status(500).json({ message: 'Error al actualizar producto' });
  }
}

/**
 * Elimina un producto existente (autorizado por ABAC en middleware previo).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 { message }, 500 { message }
 */
async function deleteProducto(req, res) {
  try {
    await prisma.producto.delete({ where: { id: req.product.id } });
    await logAction(req, 'ELIMINAR_PRODUCTO', `Producto ${req.product.id}`, 'éxito');
    return res.json({ message: 'Producto eliminado' });
  } catch (e) {
    return res.status(500).json({ message: 'Error al eliminar producto' });
  }
}

/**
 * Lista las categorías distintas disponibles en la base de datos.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 string[], 500 { message }
 */
async function listCategorias(req, res) {
  try {
    const rows = await prisma.producto.findMany({
      select: { categoria: true },
      distinct: ['categoria'],
      orderBy: { categoria: 'asc' },
    });
    const categorias = rows.map(r => r.categoria).filter(Boolean);
    return res.json(categorias);
  } catch (e) {
    return res.status(500).json({ message: 'Error al listar categorías' });
  }
}

module.exports = {
  listProductos,
  getProducto,
  createProducto,
  updateProducto,
  deleteProducto,
  listCategorias,
};
