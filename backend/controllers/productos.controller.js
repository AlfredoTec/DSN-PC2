// Controlador CRUD de Productos usando políticas ABAC
const prisma = require('../prisma/client');

// GET /api/productos
exports.list = async (req, res, next) => {
  try {
    const where = (req.abac && req.abac.where) || {};
    // Prisma: construimos filtro dinámico según ABAC
    const items = await prisma.producto.findMany({ where, orderBy: { id: 'asc' } });
    res.json(items);
  } catch (err) { next(err); }
};

// GET /api/productos/:id
exports.getOne = async (req, res, next) => {
  try {
    const prod = req.product; // seteado por getOnePolicy
    res.json(prod);
  } catch (err) { next(err); }
};

// POST /api/productos
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
exports.remove = async (req, res, next) => {
  try {
    const prod = req.product; // validado en policy
    await prisma.producto.delete({ where: { id: prod.id } });
    res.json({ message: 'Producto eliminado' });
  } catch (err) { next(err); }
};
