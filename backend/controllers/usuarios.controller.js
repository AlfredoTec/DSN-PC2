// Controlador de Usuarios para lectura/gestión básica (parte RBAC)
const { Op } = require('sequelize');
const Usuario = require('../models/Usuario');
const Tienda = require('../models/Tienda');
const Rol = require('../models/Rol');
const UsuarioRol = require('../models/UsuarioRol');
const bcrypt = require('bcryptjs');

// Helper: obtiene roles de un usuario
async function getUserRoleNames(userId) {
  const links = await UsuarioRol.findAll({ where: { usuario_id: userId } });
  const roleIds = links.map(l => l.rol_id);
  if (!roleIds.length) return [];
  const roles = await Rol.findAll({ where: { id: roleIds } });
  return roles.map(r => r.nombre);
}

// GET /api/usuarios - Admin: todos; Gerente: solo usuarios de su tienda; Empleado/Auditor: solo él mismo
exports.list = async (req, res, next) => {
  try {
    const { roles, tienda_id, id } = req.user;
    const isAdmin = roles.includes('Admin');
    const isGerente = roles.includes('Gerente');

    let where = {};
    if (isAdmin) {
      // sin filtro
    } else if (isGerente) {
      where.tienda_id = tienda_id || null;
    } else {
      where.id = id;
    }

    const usuarios = await Usuario.findAll({ where, include: [{ model: Tienda, as: 'tienda' }] });
    const result = await Promise.all(usuarios.map(async u => ({
      id: u.id,
      email: u.email,
      nombre_completo: u.nombre_completo,
      tienda_id: u.tienda_id,
      roles: await getUserRoleNames(u.id),
      activo: u.activo,
      fecha_creacion: u.fecha_creacion,
    })));
    res.json(result);
  } catch (err) { next(err); }
};

// POST /api/usuarios - Solo Admin crea usuarios
exports.create = async (req, res, next) => {
  try {
    const { email, password, nombre_completo, tienda_id } = req.body;
    if (!email || !password || !nombre_completo) return res.status(400).json({ message: 'email, password, nombre_completo requeridos' });

    const exists = await Usuario.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email ya registrado' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await Usuario.create({ email, password: hash, nombre_completo, tienda_id: tienda_id || null, activo: true });
    res.status(201).json({ id: user.id, email: user.email, nombre_completo: user.nombre_completo, tienda_id: user.tienda_id });
  } catch (err) { next(err); }
};

// PUT /api/usuarios/:id - Admin total; Gerente puede editar solo usuarios de su tienda (limitado)
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roles, tienda_id } = req.user;
    const isAdmin = roles.includes('Admin');
    const isGerente = roles.includes('Gerente');

    const user = await Usuario.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (!isAdmin && !(isGerente && user.tienda_id === tienda_id)) return res.status(403).json({ message: 'Acceso denegado' });

    const { nombre_completo, activo, tienda_id: newTiendaId } = req.body;
    if (nombre_completo !== undefined) user.nombre_completo = nombre_completo;
    if (activo !== undefined && isAdmin) user.activo = !!activo; // solo Admin activa/desactiva
    if (newTiendaId !== undefined && isAdmin) user.tienda_id = newTiendaId; // solo Admin reasigna tienda

    await user.save();
    res.json({ id: user.id, email: user.email, nombre_completo: user.nombre_completo, tienda_id: user.tienda_id, activo: user.activo });
  } catch (err) { next(err); }
};

// DELETE /api/usuarios/:id - Solo Admin
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await Usuario.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    await user.destroy();
    res.json({ message: 'Usuario eliminado' });
  } catch (err) { next(err); }
};

// POST /api/usuarios/:id/roles - Asignación de roles (solo Admin)
exports.assignRole = async (req, res, next) => {
  try {
    const { id } = req.params; // usuario id
    const { rolNombre } = req.body;
    if (!rolNombre) return res.status(400).json({ message: 'rolNombre es requerido' });

    const user = await Usuario.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const role = await Rol.findOne({ where: { nombre: rolNombre } });
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });

    await UsuarioRol.findOrCreate({ where: { usuario_id: user.id, rol_id: role.id }, defaults: { asignado_por: req.user.id } });
    res.json({ message: 'Rol asignado' });
  } catch (err) { next(err); }
};

// DELETE /api/usuarios/:id/roles - Remover rol (solo Admin)
exports.removeRole = async (req, res, next) => {
  try {
    const { id } = req.params; // usuario id
    const { rolNombre } = req.body;
    if (!rolNombre) return res.status(400).json({ message: 'rolNombre es requerido' });

    const role = await Rol.findOne({ where: { nombre: rolNombre } });
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });

    await UsuarioRol.destroy({ where: { usuario_id: id, rol_id: role.id } });
    res.json({ message: 'Rol removido' });
  } catch (err) { next(err); }
};
