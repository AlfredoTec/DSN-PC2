/**
 * Rutas para asignación y eliminación de roles a usuarios.
 *
 * Seguridad:
 * - Requiere autenticación y rol 'Administrador'.
 */
const express = require('express');
const { assignRole, removeUserRole } = require('../controllers/usuarioController');
const auth = require('../middlewares/auth');
const { checkRole } = require('../middlewares/rbac');

const router = express.Router();

router.use(auth, checkRole(['Administrador']));

router.post('/', assignRole);
router.delete('/:id', removeUserRole);

module.exports = router;
