// Rutas de autenticación y MFA
// Flujo MFA TOTP:
// 1) /login -> si el usuario tiene MFA, devuelve { mfaRequired: true, mfaToken }
// 2) /enable-mfa -> inicia la configuración (devuelve secret/otpauth + QR) usando mfaToken o JWT de sesión
// 3) /verify-mfa-setup -> valida el primer código y habilita definitivamente la MFA
// 4) /verify-mfa -> durante login, valida el código con el mfaToken temporal y entrega el JWT de sesión
// 5) /disable-mfa -> con JWT de sesión, deshabilita la MFA
const router = require('express').Router();
const { register, login, enableMfa, verifyMfaSetup, verifyMfa } = require('../controllers/auth.controller');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

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
// Deshabilita MFA (requiere Authorization: Bearer <JWT>)
router.post('/disable-mfa', async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'Token de autorización requerido' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Token inválido' });
    const token = parts[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type && payload.type === 'mfa') return res.status(401).json({ message: 'Token inválido' });
    const user = await prisma.usuario.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    await prisma.usuario.update({ where: { id: user.id }, data: { mfa_habilitado: false, mfa_secret: null } });
    return res.json({ message: 'MFA deshabilitado correctamente' });
  } catch (err) { next(err); }
});

module.exports = router;
