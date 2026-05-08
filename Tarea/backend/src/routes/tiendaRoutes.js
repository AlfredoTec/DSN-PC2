/**
 * Rutas para tiendas (catálogo de sucursales).
 *
 * Seguridad:
 * - Requiere autenticación para consultar el listado.
 */
const express = require('express');
const auth = require('../middlewares/auth');
const { listTiendas } = require('../controllers/tiendaController');

const router = express.Router();

router.use(auth);
router.get('/', listTiendas);

module.exports = router;
