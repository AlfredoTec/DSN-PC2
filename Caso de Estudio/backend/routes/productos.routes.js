// API de Productos
// Cada endpoint se protege con `auth` y políticas ABAC definidas en `middlewares/abacProductos`.
// Importante: el orden del pipeline es auth -> policy -> controller.
// - auth: valida y adjunta el usuario a `req.user` (JWT)
// - policy (ABAC): verifica permisos por rol/tienda/atributos y normaliza `req.body`/`req.abac`
// - controller: ejecuta la operación en BD usando Prisma, respetando lo que definió la policy
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
