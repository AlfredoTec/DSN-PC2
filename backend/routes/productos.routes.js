// Rutas de Productos con middleware ABAC
const router = require('express').Router();
const auth = require('../middlewares/auth');
const abac = require('../middlewares/abacProductos');
const ctrl = require('../controllers/productos.controller');

router.get('/', auth, abac.listPolicy, ctrl.list);
router.get('/:id', auth, abac.getOnePolicy, ctrl.getOne);
router.post('/', auth, abac.createPolicy, ctrl.create);
router.put('/:id', auth, abac.updatePolicy, ctrl.update);
router.delete('/:id', auth, abac.deletePolicy, ctrl.remove);

module.exports = router;
