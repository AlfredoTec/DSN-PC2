/**
 * Rutas para administración de roles.
 *
 * Seguridad:
 * - Todas requieren autenticación.
 * - Crear/actualizar/eliminar requieren rol 'Administrador' (RBAC).
 */
const express = require('express');
const { listRoles, createRole, updateRole, deleteRole } = require('../controllers/rolController');
const auth = require('../middlewares/auth');
const { checkRole } = require('../middlewares/rbac');

const router = express.Router();

router.use(auth);

// READ: cualquiera autenticado
router.get('/', listRoles);

// Admin-only
router.post('/', checkRole(['Administrador']), createRole);
router.put('/:id', checkRole(['Administrador']), updateRole);
router.delete('/:id', checkRole(['Administrador']), deleteRole);

module.exports = router;
