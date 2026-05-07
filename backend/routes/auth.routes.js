// Rutas de autenticación y MFA
const router = require('express').Router();
const { register, login, enableMfa, verifyMfaSetup, verifyMfa } = require('../controllers/auth.controller');

// Registro de usuario
router.post('/register', register);
// Login básico (si MFA habilitado, devolverá mfaRequired + mfaToken)
router.post('/login', login);
// Inicia configuración MFA: genera secreto y QR (requiere mfaToken)
router.post('/enable-mfa', enableMfa);
// Verifica y activa definitivamente el MFA (requiere mfaToken + code)
router.post('/verify-mfa-setup', verifyMfaSetup);
// Verifica el código TOTP durante el login MFA (requiere mfaToken + code)
router.post('/verify-mfa', verifyMfa);

module.exports = router;
