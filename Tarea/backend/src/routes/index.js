/**
 * Router agregador de módulos.
 *
 * Nota: En esta API los routers se montan directamente en `app.js`.
 * Este archivo sirve como índice si se desea montar todo bajo un prefijo común.
 */
const express = require('express');
const authRoutes = require('./authRoutes');
const rolRoutes = require('./rolRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const productoRoutes = require('./productoRoutes');

const router = express.Router();

// Subrutas por dominio
router.use('/auth', authRoutes); // Autenticación y MFA
router.use('/roles', rolRoutes); // Administración de roles
router.use('/usuarios', usuarioRoutes); // CRUD de usuarios
router.use('/productos', productoRoutes); // CRUD de productos (con ABAC)

module.exports = router;
