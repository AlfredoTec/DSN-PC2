/**
 * Rutas de productos.
 *
 * Seguridad:
 * - Requiere autenticación.
 * - Autorización por atributos (ABAC) según rol, tienda y campos permitidos.
 */
const express = require('express');
const auth = require('../middlewares/auth');
const { checkAbac } = require('../middlewares/abac');
const {
  listProductos,
  getProducto,
  createProducto,
  updateProducto,
  deleteProducto,
  listCategorias,
} = require('../controllers/productoController');

const router = express.Router();

router.use(auth);

router.get('/', listProductos); // Listado con filtros y aislamiento por tienda
router.get('/categorias', listCategorias); // Lista de categorías disponibles
router.get('/:id', checkAbac('read'), getProducto); // Leer un producto
router.post('/', checkAbac('create'), createProducto); // Crear producto
router.put('/:id', checkAbac('update'), updateProducto); // Actualizar campos permitidos
router.delete('/:id', checkAbac('delete'), deleteProducto); // Eliminar producto

module.exports = router;
