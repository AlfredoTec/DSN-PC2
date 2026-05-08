/**
 * Rutas de autenticación y MFA.
 *
 * Endpoints:
 * - POST /register: Registro de nuevos usuarios con validación de password fuerte y tienda.
 * - POST /login: Autenticación; puede requerir MFA según configuración del usuario.
 * - POST /enable-mfa: Habilita MFA para el usuario autenticado.
 * - POST /verify-mfa: Verifica el código TOTP y entrega token de acceso.
 */
const express = require('express');
const { body } = require('express-validator');
const { register, login, enableMfa, confirmMfaSetup, verifyMfa, me, disableMfa } = require('../controllers/authController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Requisito mínimo de contraseña: 8+ chars, 1 mayúscula, 1 dígito y 1 símbolo
const passwordRule = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

// Registro de usuario nuevo
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').matches(passwordRule).withMessage('Password débil'),
    body('nombreCompleto').notEmpty().withMessage('nombreCompleto requerido'),
    body('tiendaId').isInt().withMessage('tiendaId inválido'),
  ],
  register
);

// Autenticación (puede iniciar flujo MFA si está habilitado)
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('password requerido'),
  ],
  login
);

// Habilitar MFA para el usuario autenticado
router.post(
  '/enable-mfa',
  auth,
  enableMfa
);

// Confirmar MFA ingresando código TOTP
router.post(
  '/enable-mfa/verify-code',
  auth,
  body('codigoTOTP').isLength({ min: 6, max: 6 }).withMessage('codigoTOTP inválido'),
  confirmMfaSetup
);

// Perfil del usuario autenticado
router.get('/me', auth, me);

// Deshabilitar MFA
router.post('/disable-mfa', auth, disableMfa);

// Verificación del código TOTP y emisión de token de acceso
router.post(
  '/verify-mfa',
  [
    body('tempToken').notEmpty().withMessage('tempToken requerido'),
    body('codigoTOTP').isLength({ min: 6, max: 6 }).withMessage('codigoTOTP inválido'),
  ],
  verifyMfa
);

module.exports = router;
