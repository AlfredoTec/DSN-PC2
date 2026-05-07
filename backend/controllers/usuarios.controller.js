// Controlador de Usuarios para lectura/gestión básica (parte RBAC)
const prisma = require('../prisma/client');
const bcrypt = require('bcryptjs');

// Helper: obtiene roles de un usuario
async function getUserRoleNames(userId) {
  const links = await prisma.usuarioRol.findMany({ where: { usuario_id: userId }, include: { rol: true } });
  return links.map(l => l.rol.nombre);
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

    const usuarios = await prisma.usuario.findMany({ where });
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

    const exists = await prisma.usuario.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email ya registrado' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await prisma.usuario.create({ data: { email, password: hash, nombre_completo, tienda_id: tienda_id || null, activo: true } });
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

    const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (!isAdmin && !(isGerente && user.tienda_id === tienda_id)) return res.status(403).json({ message: 'Acceso denegado' });

    const { nombre_completo, activo, tienda_id: newTiendaId } = req.body;
    const data = {};
    if (nombre_completo !== undefined) data.nombre_completo = nombre_completo;
    if (activo !== undefined && isAdmin) data.activo = !!activo; // solo Admin activa/desactiva
    if (newTiendaId !== undefined && isAdmin) data.tienda_id = newTiendaId; // solo Admin reasigna tienda

    const updated = await prisma.usuario.update({ where: { id: Number(id) }, data });
    res.json({ id: updated.id, email: updated.email, nombre_completo: updated.nombre_completo, tienda_id: updated.tienda_id, activo: updated.activo });
  } catch (err) { next(err); }
};

// DELETE /api/usuarios/:id - Solo Admin
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    await prisma.usuario.delete({ where: { id: Number(id) } });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) { next(err); }
};

// POST /api/usuarios/:id/roles - Asignación de roles (solo Admin)
exports.assignRole = async (req, res, next) => {
  try {
    const { id } = req.params; // usuario id
    const { rolNombre } = req.body;
    if (!rolNombre) return res.status(400).json({ message: 'rolNombre es requerido' });

    const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const role = await prisma.rol.findUnique({ where: { nombre: rolNombre } });
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });

    await prisma.usuarioRol.upsert({
      where: { usuario_id_rol_id: { usuario_id: user.id, rol_id: role.id } },
      update: {},
      create: { usuario_id: user.id, rol_id: role.id, asignado_por: req.user.id }
    });
    res.json({ message: 'Rol asignado' });
  } catch (err) { next(err); }
};

// DELETE /api/usuarios/:id/roles - Remover rol (solo Admin)
exports.removeRole = async (req, res, next) => {
  try {
    const { id } = req.params; // usuario id
    const { rolNombre } = req.body;
    if (!rolNombre) return res.status(400).json({ message: 'rolNombre es requerido' });

    const role = await prisma.rol.findUnique({ where: { nombre: rolNombre } });
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });

    await prisma.usuarioRol.delete({ where: { usuario_id_rol_id: { usuario_id: Number(id), rol_id: role.id } } });
    res.json({ message: 'Rol removido' });
  } catch (err) { next(err); }
};
