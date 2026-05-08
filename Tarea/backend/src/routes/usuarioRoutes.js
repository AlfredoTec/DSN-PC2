/**
 * Rutas de administración de usuarios.
 *
 * Seguridad:
 * - Requiere autenticación y rol 'Administrador' para todas las operaciones.
 */
const express = require('express');
const {
  listUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} = require('../controllers/usuarioController');
const auth = require('../middlewares/auth');
const { checkRole } = require('../middlewares/rbac');

const router = express.Router();

router.use(auth, checkRole(['Administrador']));

router.get('/', listUsuarios); // Listar usuarios con roles y tienda
router.get('/:id', getUsuario); // Obtener detalle de un usuario
router.post('/', createUsuario); // Crear usuario y asignar roles
router.put('/:id', updateUsuario); // Actualizar datos del usuario
router.delete('/:id', deleteUsuario); // Eliminar o desactivar usuario

module.exports = router;
