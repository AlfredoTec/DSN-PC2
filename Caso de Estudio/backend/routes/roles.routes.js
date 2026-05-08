// API de Roles
// Lectura abierta para usuarios autenticados; modificaciones solo para rol Admin usando `authorizeRoles('Admin')`.
const router = require('express').Router();
const auth = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/authorizeRoles');
const ctrl = require('../controllers/roles.controller');

// Todos pueden leer roles
router.get('/', auth, ctrl.list);
// Solo Admin puede crear/actualizar/eliminar
router.post('/', auth, authorizeRoles('Admin'), ctrl.create);
router.put('/:id', auth, authorizeRoles('Admin'), ctrl.update);
router.delete('/:id', auth, authorizeRoles('Admin'), ctrl.remove);

module.exports = router;
