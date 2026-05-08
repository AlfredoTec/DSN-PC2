// API de Tiendas
// - GET: listado simple para dropdowns (requiere usuario autenticado)
// - POST/PUT/DELETE: restringido a Admin
// Nota: en DELETE se maneja el error Prisma P2003 (violación de foreign key) para dar un mensaje claro.
const router = require('express').Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/tiendas.controller');
const prisma = require('../prisma/client');

// Listado de tiendas (protegido, cualquier usuario autenticado)
router.get('/', auth, ctrl.list);

router.post('/', auth, async (req, res, next) => {
  try {
    const roles = req.user?.roles || [];
    if (!roles.includes('Admin')) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    const { nombre, ubicacion } = req.body || {};
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }
    const name = nombre.trim();
    const exists = await prisma.tienda.findFirst({ where: { nombre: name } });
    if (exists) {
      return res.status(409).json({ message: 'Ya existe una tienda con ese nombre' });
    }
    const tienda = await prisma.tienda.create({ data: { nombre: name, ubicacion: ubicacion || '' } });
    return res.status(201).json(tienda);
  } catch (err) { next(err); }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const roles = req.user?.roles || [];
    if (!roles.includes('Admin')) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const { nombre, ubicacion } = req.body || {};
    const current = await prisma.tienda.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ message: 'Tienda no encontrada' });
    let data = {};
    if (typeof ubicacion === 'string') data.ubicacion = ubicacion;
    if (typeof nombre === 'string') {
      const name = nombre.trim();
      if (name === '') return res.status(400).json({ message: 'El nombre no puede estar vacío' });
      const conflict = await prisma.tienda.findFirst({ where: { nombre: name, NOT: { id } } });
      if (conflict) return res.status(409).json({ message: 'Ya existe una tienda con ese nombre' });
      data.nombre = name;
    }
    const updated = await prisma.tienda.update({ where: { id }, data });
    return res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const roles = req.user?.roles || [];
    if (!roles.includes('Admin')) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    try {
      await prisma.tienda.delete({ where: { id } });
      return res.json({ message: 'Tienda eliminada' });
    } catch (e) {
      if (e && e.code === 'P2003') {
        return res.status(409).json({ message: 'No se puede eliminar la tienda: tiene dependencias' });
      }
      throw e;
    }
  } catch (err) { next(err); }
});

module.exports = router;
