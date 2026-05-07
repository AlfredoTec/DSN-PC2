// Controlador de Roles para CRUD con restricciones RBAC
const Rol = require('../models/Rol');
const UsuarioRol = require('../models/UsuarioRol');

// GET /api/roles -> Todos pueden ver
exports.list = async (req, res, next) => {
  try {
    const roles = await Rol.findAll({ order: [['id', 'ASC']] });
    res.json(roles);
  } catch (err) { next(err); }
};

// POST /api/roles -> Solo Admin
exports.create = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ message: 'nombre es requerido' });
    const exists = await Rol.findOne({ where: { nombre } });
    if (exists) return res.status(409).json({ message: 'El rol ya existe' });
    const role = await Rol.create({ nombre, descripcion });
    res.status(201).json(role);
  } catch (err) { next(err); }
};

// PUT /api/roles/:id -> Solo Admin
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const role = await Rol.findByPk(id);
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
    if (nombre) role.nombre = nombre;
    if (descripcion !== undefined) role.descripcion = descripcion;
    await role.save();
    res.json(role);
  } catch (err) { next(err); }
};

// DELETE /api/roles/:id -> Solo Admin y no eliminar si tiene usuarios asignados
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Rol.findByPk(id);
    if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
    const assigned = await UsuarioRol.count({ where: { rol_id: id } });
    if (assigned > 0) return res.status(400).json({ message: 'No se puede eliminar un rol con usuarios asignados' });
    await role.destroy();
    res.json({ message: 'Rol eliminado' });
  } catch (err) { next(err); }
};
