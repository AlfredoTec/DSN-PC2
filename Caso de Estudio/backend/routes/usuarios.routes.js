// API de Usuarios (RBAC)
// - Todas las rutas requieren autenticación (`auth`).
// - Para acciones sensibles se usa `authorizeRoles('Admin')` para verificar que el usuario tenga el rol.
// - La lógica fina de alcance por rol (p. ej., Gerente solo usuarios de su tienda) se resuelve en el controlador.
const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/authorizeRoles');
const ctrl = require('../controllers/usuarios.controller');

// Listado condicionado por rol (ver controlador para reglas por rol)
router.get('/', auth, ctrl.list);
// Crear usuario: solo Admin
router.post('/', auth, authorizeRoles('Admin'), ctrl.create);
// Actualizar: Admin total; Gerente limitaciones
router.put('/:id', auth, ctrl.update);
// Eliminar: solo Admin
router.delete('/:id', auth, authorizeRoles('Admin'), ctrl.remove);
// Asignar/remover rol: solo Admin
router.post('/:id/roles', auth, authorizeRoles('Admin'), ctrl.assignRole);
router.delete('/:id/roles', auth, authorizeRoles('Admin'), ctrl.removeRole);

module.exports = router;
