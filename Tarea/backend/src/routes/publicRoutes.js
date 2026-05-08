const express = require('express');
const { listTiendas } = require('../controllers/tiendaController');

const router = express.Router();

router.get('/tiendas', listTiendas);

module.exports = router;
