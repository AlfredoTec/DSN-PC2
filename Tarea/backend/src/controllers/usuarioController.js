/**
 * Controlador de usuarios: listado, obtención, creación, actualización, eliminación
 * y asignaciones de roles. Incluye auditoría.
 */
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');
const { logAction } = require('../middlewares/logger');

/**
 * Lista usuarios con sus roles y tienda, devolviendo una vista simplificada.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 Usuario[]
 */
async function listUsuarios(req, res) {
  const usuarios = await prisma.usuario.findMany({
    include: {
      tienda: true,
      roles: { include: { rol: true } },
    },
    orderBy: { id: 'asc' },
  });
  const mapped = usuarios.map((u) => ({
    id: u.id,
    email: u.email,
    nombreCompleto: u.nombreCompleto,
    tienda: u.tienda.nombre,
    activo: u.activo,
    roles: u.roles.map((r) => r.rol.nombre),
    fechaCreacion: u.fechaCreacion,
  }));
  return res.json(mapped);
}

/**
 * Obtiene el detalle de un usuario por id.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 Usuario, 404 { message }
 */
async function getUsuario(req, res) {
  const id = parseInt(req.params.id, 10);
  const u = await prisma.usuario.findUnique({
    where: { id },
    include: {
      tienda: true,
      roles: { include: { rol: true } },
    },
  });
  if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
  return res.json({
    id: u.id,
    email: u.email,
    nombreCompleto: u.nombreCompleto,
    tienda: u.tienda.nombre,
    activo: u.activo,
    roles: u.roles.map((r) => r.rol.nombre),
  });
}

/**
 * Crea un usuario y asigna roles.
 * - Valida unicidad de email y existencia de tienda.
 * - Por defecto asigna rol 'Empleado' si no se especifican roles.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 201 { id }, 400 { message }, 500 { message }
 */
async function createUsuario(req, res) {
  const { email, password, nombreCompleto, tiendaId, roleIds } = req.body;
  if (!email || !password || !nombreCompleto || !tiendaId) {
    return res.status(400).json({ message: 'Campos requeridos: email, password, nombreCompleto, tiendaId' });
  }
  try {
    const tienda = await prisma.tienda.findUnique({ where: { id: Number(tiendaId) } });
    if (!tienda) return res.status(400).json({ message: 'tiendaId inválido' });
    const exists = await prisma.usuario.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email duplicado' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.usuario.create({
      data: { email, password: hashed, nombreCompleto, tiendaId: tienda.id, activo: true },
    });

    const rolesToAssign = Array.isArray(roleIds) && roleIds.length > 0
      ? await prisma.rol.findMany({ where: { id: { in: roleIds.map((n) => Number(n)) } } })
      : [await prisma.rol.findUnique({ where: { nombre: 'Empleado' } })];

    for (const r of rolesToAssign) {
      await prisma.usuarioRol.create({
        data: { usuarioId: user.id, rolId: r.id, asignadoPorId: req.user.id },
      });
    }

    await logAction(req, 'CREAR_USUARIO', `Usuario ${user.email}`, 'éxito');
    return res.status(201).json({ id: user.id });
  } catch (e) {
    return res.status(500).json({ message: 'Error al crear usuario' });
  }
}

/**
 * Actualiza campos de un usuario. Impide desactivar la propia cuenta del solicitante.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 { id }, 400/404 { message }
 */
async function updateUsuario(req, res) {
  const id = parseInt(req.params.id, 10);
  const { nombreCompleto, email, tiendaId, activo } = req.body;
  try {
    const data = {};
    if (nombreCompleto !== undefined) data.nombreCompleto = nombreCompleto;
    if (email !== undefined) data.email = email;
    if (tiendaId !== undefined) data.tiendaId = Number(tiendaId);
    if (activo !== undefined) {
      const nextActivo = Boolean(activo);
      if (!nextActivo && id === req.user.id) {
        return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
      }
      data.activo = nextActivo;
    }
    const u = await prisma.usuario.update({ where: { id }, data });
    await logAction(req, 'ACTUALIZAR_USUARIO', `Usuario ${id}`, 'éxito');
    return res.json({ id: u.id });
  } catch (e) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
}

/**
 * Elimina (físico) o desactiva (lógico) un usuario según query `hard`.
 * Bloquea acciones sobre la propia cuenta del solicitante.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 { message }, 400/404 { message }
 */
async function deleteUsuario(req, res) {
  const id = parseInt(req.params.id, 10);
  const hard = (req.query.hard || '').toString().toLowerCase() === 'true';
  try {
    if (id === req.user.id) {
      return res.status(400).json({ message: 'No puedes eliminar o desactivar tu propia cuenta' });
    }
    if (hard) {
      await prisma.usuarioRol.deleteMany({ where: { usuarioId: id } });
      await prisma.usuario.delete({ where: { id } });
      await logAction(req, 'ELIMINAR_USUARIO', `Usuario ${id}`, 'éxito');
      return res.json({ message: 'Usuario eliminado (físico)' });
    } else {
      await prisma.usuario.update({ where: { id }, data: { activo: false } });
      await prisma.usuarioRol.deleteMany({ where: { usuarioId: id } });
      await logAction(req, 'ELIMINAR_USUARIO', `Usuario ${id}`, 'éxito');
      return res.json({ message: 'Usuario desactivado (lógico)' });
    }
  } catch (e) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
}

/**
 * Asigna un rol a un usuario.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 201 UsuarioRol, 400 { message }
 */
async function assignRole(req, res) {
  const { usuarioId, rolId } = req.body;
  if (!usuarioId || !rolId) return res.status(400).json({ message: 'usuarioId y rolId requeridos' });
  try {
    const u = await prisma.usuario.findUnique({ where: { id: Number(usuarioId) } });
    const r = await prisma.rol.findUnique({ where: { id: Number(rolId) } });
    if (!u || !r) return res.status(400).json({ message: 'Usuario o rol inválido' });

    const ur = await prisma.usuarioRol.create({
      data: { usuarioId: u.id, rolId: r.id, asignadoPorId: req.user.id },
    });
    await logAction(req, 'ASIGNAR_ROL', `UsuarioRol ${ur.id}`, 'éxito');
    return res.status(201).json(ur);
  } catch (e) {
    return res.status(400).json({ message: 'Error al asignar rol (¿duplicado?)' });
  }
}

/**
 * Elimina una asignación usuario-rol por id de la relación.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 { message }, 404 { message }
 */
async function removeUserRole(req, res) {
  const id = parseInt(req.params.id, 10);
  try {
    await prisma.usuarioRol.delete({ where: { id } });
    await logAction(req, 'REMOVER_ROL_USUARIO', `UsuarioRol ${id}`, 'éxito');
    return res.json({ message: 'Asignación eliminada' });
  } catch (e) {
    return res.status(404).json({ message: 'Asignación no encontrada' });
  }
}

module.exports = {
  listUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  assignRole,
  removeUserRole,
};
