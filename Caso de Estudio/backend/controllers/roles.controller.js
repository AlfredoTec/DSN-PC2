// Controlador de Roles para CRUD con restricciones RBAC
const prisma = require('../prisma/client');

// GET /api/roles -> Todos pueden ver
/**
 * GET /api/roles
 * Lista todos los roles.
 * @param {import('express').Request} req
 * @param {import('express').Response} res - 200 Rol[]
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
exports.list = async (req, res, next) => {
  try {
    const roles = await prisma.rol.findMany({ orderBy: { id: 'asc' } });
    res.json(roles);
  } catch (err) { next(err); }
};

// POST /api/roles -> Solo Admin
/**
 * POST /api/roles
 * Crea un nuevo rol (solo Admin).
 * @param {import('express').Request} req - Body: { nombre: string, descripcion?: string }
 * @param {import('express').Response} res - 201 Rol
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
exports.create = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ message: 'nombre es requerido' });
    const exists = await prisma.rol.findUnique({ where: { nombre } });
    if (exists) return res.status(409).json({ message: 'El rol ya existe' });
    const role = await prisma.rol.create({ data: { nombre, descripcion } });
    res.status(201).json(role);
  } catch (err) { next(err); }
};

// PUT /api/roles/:id -> Solo Admin
/**
 * PUT /api/roles/:id
 * Actualiza nombre/descripcion de un rol (solo Admin).
 * @param {import('express').Request} req - Params: { id }, Body: { nombre?: string, descripcion?: string }
 * @param {import('express').Response} res - 200 Rol
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const role = await prisma.rol.findUnique({ where: { id: Number(id) } });
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
    const updated = await prisma.rol.update({ where: { id: Number(id) }, data: { nombre: nombre || role.nombre, descripcion: descripcion !== undefined ? descripcion : role.descripcion } });
    res.json(updated);
  } catch (err) { next(err); }
};

// DELETE /api/roles/:id -> Solo Admin y no eliminar si tiene usuarios asignados
/**
 * DELETE /api/roles/:id
 * Elimina un rol si no tiene usuarios asignados (solo Admin).
 * @param {import('express').Request} req - Params: { id }
 * @param {import('express').Response} res - 200 { message }
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await prisma.rol.findUnique({ where: { id: Number(id) } });
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
    const assigned = await prisma.usuarioRol.count({ where: { rol_id: Number(id) } });
    if (assigned > 0) return res.status(400).json({ message: 'No se puede eliminar un rol con usuarios asignados' });
    await prisma.rol.delete({ where: { id: Number(id) } });
    res.json({ message: 'Rol eliminado' });
  } catch (err) { next(err); }
};
