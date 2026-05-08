/**
 * Controlador de roles (CRUD básico con validaciones simples y auditoría).
 */
const prisma = require('../prisma/client');
const { logAction } = require('../middlewares/logger');

/**
 * Lista todos los roles ordenados por id.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 Rol[]
 */
async function listRoles(req, res) {
  const roles = await prisma.rol.findMany({ orderBy: { id: 'asc' } });
  return res.json(roles);
}

/**
 * Crea un nuevo rol.
 * Requiere campo `nombre`.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 201 Rol, 400 { message }
 */
async function createRole(req, res) {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ message: 'nombre requerido' });
  try {
    const role = await prisma.rol.create({ data: { nombre, descripcion } });
    await logAction(req, 'CREAR_ROL', `Rol ${role.id}`, 'éxito');
    return res.status(201).json(role);
  } catch (e) {
    return res.status(400).json({ message: 'No se pudo crear rol (¿nombre duplicado?)' });
  }
}

/**
 * Actualiza la descripción de un rol existente.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 Rol, 404 { message }
 */
async function updateRole(req, res) {
  const id = parseInt(req.params.id, 10);
  const { descripcion } = req.body;
  try {
    const role = await prisma.rol.update({ where: { id }, data: { descripcion } });
    await logAction(req, 'ACTUALIZAR_ROL', `Rol ${id}`, 'éxito');
    return res.json(role);
  } catch (e) {
    return res.status(404).json({ message: 'Rol no encontrado' });
  }
}

/**
 * Elimina un rol si no es por defecto ni tiene usuarios asignados.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 { message }, 400/404/500 { message }
 */
async function deleteRole(req, res) {
  const id = parseInt(req.params.id, 10);
  const defaultNames = ['Administrador', 'Gerente', 'Empleado', 'Auditor'];
  try {
    const role = await prisma.rol.findUnique({ where: { id } });
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
    if (defaultNames.includes(role.nombre)) return res.status(400).json({ message: 'No se puede borrar un rol por defecto' });

    const assigned = await prisma.usuarioRol.count({ where: { rolId: id } });
    if (assigned > 0) return res.status(400).json({ message: 'No se puede borrar un rol con usuarios asignados' });

    await prisma.rol.delete({ where: { id } });
    await logAction(req, 'ELIMINAR_ROL', `Rol ${id}`, 'éxito');
    return res.json({ message: 'Rol eliminado' });
  } catch (e) {
    return res.status(500).json({ message: 'Error al eliminar rol' });
  }
}

module.exports = { listRoles, createRole, updateRole, deleteRole };
