// Controlador CRUD de Productos usando políticas ABAC
const prisma = require('../prisma/client');

// GET /api/productos
/**
 * GET /api/productos
 * Lista productos aplicando el filtro ABAC inyectado en `req.abac.where`.
 * @param {import('express').Request} req - req.abac.where opcional para filtrar por tienda u otros atributos
 * @param {import('express').Response} res - 200 Producto[]
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
exports.list = async (req, res, next) => {
  try {
    const where = (req.abac && req.abac.where) || {};
    // Prisma: construimos filtro dinámico según ABAC
    const items = await prisma.producto.findMany({ where, orderBy: { id: 'asc' } });
    res.json(items);
  } catch (err) { next(err); }
};

// GET /api/productos/:id
/**
 * GET /api/productos/:id
 * Devuelve el detalle de un producto previamente autorizado por la policy ABAC.
 * @param {import('express').Request} req - req.product ya cargado por getOnePolicy
 * @param {import('express').Response} res - 200 Producto
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
exports.getOne = async (req, res, next) => {
  try {
    const prod = req.product; // seteado por getOnePolicy
    res.json(prod);
  } catch (err) { next(err); }
};

// POST /api/productos
/**
 * POST /api/productos
 * Crea un producto respetando las restricciones definidas por la policy ABAC.
 * @param {import('express').Request} req - Body con datos del producto; se fuerza `creado_por` = req.user.id
 * @param {import('express').Response} res - 201 Producto
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
exports.create = async (req, res, next) => {
  try {
    const body = req.body;
    // creado_por viene del usuario autenticado
    body.creado_por = req.user.id;
    const created = await prisma.producto.create({ data: body });
    res.status(201).json(created);
  } catch (err) { next(err); }
};

// PUT /api/productos/:id
/**
 * PUT /api/productos/:id
 * Actualiza un producto autorizado. Para Empleado solo permite `stock`; para Gerente restringe `categoria` y `tienda_id`.
 * @param {import('express').Request} req - req.product cargado y posibles reglas en req.abacUpdate
 * @param {import('express').Response} res - 200 Producto actualizado
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
exports.update = async (req, res, next) => {
  try {
    const prod = req.product; // cargado en policy
    const update = req.body || {};

    // Restringe campos para Empleado (solo stock)
    if (req.abacUpdate && Array.isArray(req.abacUpdate.allowedFields)) {
      const allowed = req.abacUpdate.allowedFields;
      const payload = {};
      for (const k of allowed) if (k in update) payload[k] = update[k];
      Object.assign(prod, payload);
    } else {
      // Admin o Gerente con restricciones ya validadas (categoria bloqueada para Gerente en policy)
      Object.assign(prod, update);
      // Si hay cambio de tienda_id del Gerente a otra tienda, ya fue impedido en policy
    }

    // Construir payload de actualización seguro (nunca enviar id ni fechas de creación)
    const base = req.abacUpdate && Array.isArray(req.abacUpdate.allowedFields)
      ? Object.fromEntries(Object.entries(update).filter(([k]) => req.abacUpdate.allowedFields.includes(k)))
      : update;
    const { id: _omitId, fecha_creacion: _fc, fecha_actualizacion: _fa, creado_por: _cp, ...data } = base;
    const saved = await prisma.producto.update({ where: { id: prod.id }, data: { ...data, fecha_actualizacion: new Date() } });
    res.json(saved);
  } catch (err) { next(err); }
};

// DELETE /api/productos/:id
/**
 * DELETE /api/productos/:id
 * Elimina un producto autorizado por la policy ABAC.
 * @param {import('express').Request} req - req.product validado por deletePolicy
 * @param {import('express').Response} res - 200 { message }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
exports.remove = async (req, res, next) => {
  try {
    const prod = req.product; // validado en policy
    await prisma.producto.delete({ where: { id: prod.id } });
    res.json({ message: 'Producto eliminado' });
  } catch (err) { next(err); }
};
