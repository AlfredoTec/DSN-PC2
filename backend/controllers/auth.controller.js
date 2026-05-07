// Controlador de autenticación y MFA TOTP
// Incluye: registro, login con bloqueo por intentos, y flujo MFA (enable, verify-setup, verify-login)
const bcrypt = require('bcryptjs'); // hashing de contraseñas
const jwt = require('jsonwebtoken'); // emisión/validación de JWT
const QRCode = require('qrcode'); // generación de QR para TOTP
const speakeasy = require('speakeasy'); // TOTP (Google Authenticator)
const prisma = require('../prisma/client');

// RegEx para contraseña segura: min 8, 1 mayúscula, 1 dígito, 1 especial
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Firma un JWT con el secreto de la app; por defecto 1h
function signJwt(payload, expiresIn = '1h') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

// Almacén en memoria para contar intentos de MFA por token temporal
// Estructura: { mfaJti: { attempts: number, userId: number, exp: timestampMs } }
const mfaAttemptStore = new Map();

// Genera un JWT temporal de 5 minutos para el flujo MFA tras login básico
function signMfaJwt(payload) {
  // Incluir un jti para poder trackear intentos en memoria
  const jti = `${payload.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const token = jwt.sign({ ...payload, jti, type: 'mfa' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const decoded = jwt.decode(token);
  mfaAttemptStore.set(jti, { attempts: 0, userId: payload.id, exp: decoded.exp * 1000 });
  return token;
}

// Valida un token MFA y devuelve { userId, jti } si es válido
function verifyMfaJwt(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'mfa') throw new Error('Tipo de token inválido');
  return { userId: decoded.id, jti: decoded.jti };
}

// Valida un JWT normal de sesión (para usuarios sin MFA que desean habilitarla)
function verifyAuthJwtFromHeader(authorization) {
  if (!authorization) return null;
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  const token = parts[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type && decoded.type === 'mfa') return null; // no aceptar tokens mfa aquí
  return { userId: decoded.id };
}

// Obtiene los nombres de roles asociados a un usuario
async function getUserRoleNames(userId) {
  const links = await prisma.usuarioRol.findMany({ where: { usuario_id: userId }, include: { rol: true } });
  return links.map(l => l.rol.nombre);
}

// POST /api/auth/register
// Registra un usuario nuevo con validación de contraseña y email único
exports.register = async (req, res, next) => {
  try {
    const { email, password, nombre_completo, tienda_id } = req.body;

    // Validaciones mínimas del payload
    if (!email || !password || !nombre_completo) {
      return res.status(400).json({ message: 'email, password y nombre_completo son requeridos' });
    }

    // Fuerza de contraseña
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial' });
    }

    // Email único
    const exists = await prisma.usuario.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: 'Email ya registrado' });
    }

    // Validación de tienda si se provee
    if (tienda_id) {
      const tienda = await prisma.tienda.findUnique({ where: { id: tienda_id } });
      if (!tienda) return res.status(400).json({ message: 'tienda_id inválido' });
    }

    // Hash de contraseña con 10 rondas
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Crea usuario activo con MFA deshabilitado por defecto
    const user = await prisma.usuario.create({
      data: {
        email,
        password: hash,
        nombre_completo,
        tienda_id: tienda_id || null,
        activo: true,
        intentos_fallidos: 0,
        mfa_habilitado: false,
      }
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      nombre_completo: user.nombre_completo,
      tienda_id: user.tienda_id,
      message: 'Usuario registrado correctamente'
    });
  } catch (err) { next(err); }
};

// POST /api/auth/login
// Valida credenciales, gestiona intentos fallidos y bloqueo temporal
// Si el usuario tiene MFA habilitado: devuelve mfaRequired con token temporal de 5m
// Si no: devuelve JWT definitivo de sesión
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email y password son requeridos' });

    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Verifica si la cuenta está bloqueada
    if (user.bloqueado_hasta && user.bloqueado_hasta > new Date()) {
      const mins = Math.ceil((user.bloqueado_hasta - new Date()) / 60000);
      return res.status(423).json({ message: `Cuenta bloqueada. Intente en ${mins} min` });
    }

    // Compara hash de contraseña
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;
      if (nuevosIntentos >= 5) {
        await prisma.usuario.update({ where: { id: user.id }, data: { intentos_fallidos: 0, bloqueado_hasta: new Date(Date.now() + 15 * 60000) } });
      } else {
        await prisma.usuario.update({ where: { id: user.id }, data: { intentos_fallidos: nuevosIntentos } });
      }
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Resetea contadores en caso de éxito
    await prisma.usuario.update({ where: { id: user.id }, data: { intentos_fallidos: 0, bloqueado_hasta: null } });

    // Si el usuario tiene MFA habilitado: emitir token MFA temporal
    if (user.mfa_habilitado) {
      const mfaToken = signMfaJwt({ id: user.id, email: user.email });
      return res.json({ mfaRequired: true, mfaToken });
    }

    // Si no tiene MFA, emitir el JWT definitivo con roles
    const roles = await getUserRoleNames(user.id);
    const token = signJwt({ id: user.id, email: user.email, tienda_id: user.tienda_id, roles });
    return res.json({ token, user: { id: user.id, email: user.email, nombre_completo: user.nombre_completo, tienda_id: user.tienda_id, roles } });
  } catch (err) { next(err); }
};

// POST /api/auth/enable-mfa
// Protegido con token MFA temporal (obtenido tras login básico cuando el usuario decide habilitar MFA)
// Genera un secreto TOTP, lo guarda y devuelve la URL otpauth y un QR (base64) para escanear con Google Authenticator
exports.enableMfa = async (req, res, next) => {
  try {
    const { mfaToken } = req.body;
    // Acepta mfaToken temporal O bien Authorization: Bearer <JWT> para usuarios sin MFA aún
    let userIdToUse = null;
    if (mfaToken) {
      try {
        const parsed = verifyMfaJwt(mfaToken);
        userIdToUse = parsed.userId;
      } catch (e) {
        return res.status(401).json({ message: 'mfaToken inválido o expirado' });
      }
    } else {
      const parsedAuth = verifyAuthJwtFromHeader(req.headers.authorization);
      if (!parsedAuth) return res.status(401).json({ message: 'Token de autorización requerido' });
      userIdToUse = parsedAuth.userId;
    }

    const user = await prisma.usuario.findUnique({ where: { id: userIdToUse } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Genera secreto TOTP
    const secret = speakeasy.generateSecret({ name: `TechStore (${user.email})` });
    await prisma.usuario.update({ where: { id: user.id }, data: { mfa_secret: secret.base32, mfa_habilitado: false } });

    // URL otpauth y QR base64
    const otpauthUrl = secret.otpauth_url;
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    return res.json({ otpauthUrl, otpauth: otpauthUrl, qrDataUrl });
  } catch (err) { next(err); }
};

// POST /api/auth/verify-mfa-setup
// Protegido con token MFA temporal; verifica un código de 6 dígitos y habilita MFA definitivamente
exports.verifyMfaSetup = async (req, res, next) => {
  try {
    const { mfaToken, code } = req.body;
    if (!code) return res.status(400).json({ message: 'code es requerido' });

    // Acepta mfaToken temporal O bien Authorization: Bearer <JWT> para usuarios sin MFA aún
    let userIdToUse = null;
    if (mfaToken) {
      try {
        const parsed = verifyMfaJwt(mfaToken);
        userIdToUse = parsed.userId;
      } catch (e) {
        return res.status(401).json({ message: 'mfaToken inválido o expirado' });
      }
    } else {
      const parsedAuth = verifyAuthJwtFromHeader(req.headers.authorization);
      if (!parsedAuth) return res.status(401).json({ message: 'Token de autorización requerido' });
      userIdToUse = parsedAuth.userId;
    }

    const user = await prisma.usuario.findUnique({ where: { id: userIdToUse } });
    if (!user || !user.mfa_secret) return res.status(400).json({ message: 'MFA no iniciado' });

    // Verifica el TOTP con ventana de 1 por tolerancia de reloj
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) return res.status(401).json({ message: 'Código inválido' });

    await prisma.usuario.update({ where: { id: user.id }, data: { mfa_habilitado: true } });

    return res.json({ message: 'MFA habilitado correctamente' });
  } catch (err) { next(err); }
};

// POST /api/auth/verify-mfa
// Verifica el código TOTP tras login básico usando el mfaToken temporal
// Si el código es correcto, devuelve el JWT definitivo de sesión
// Limita a máximo 3 intentos por mfaToken; al 3er fallo se invalida
exports.verifyMfa = async (req, res, next) => {
  try {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) return res.status(400).json({ message: 'mfaToken y code son requeridos' });

    let parsed;
    try { parsed = verifyMfaJwt(mfaToken); } catch (e) { return res.status(401).json({ message: 'mfaToken inválido o expirado' }); }

    const { jti, userId } = parsed;
    const track = mfaAttemptStore.get(jti);
    if (!track || Date.now() > track.exp) {
      mfaAttemptStore.delete(jti);
      return res.status(401).json({ message: 'mfaToken inválido o expirado' });
    }

    const user = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!user || !user.mfa_secret || !user.mfa_habilitado) {
      return res.status(400).json({ message: 'MFA no habilitado para este usuario' });
    }

    const ok = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!ok) {
      track.attempts += 1;
      mfaAttemptStore.set(jti, track);
      if (track.attempts >= 3) {
        mfaAttemptStore.delete(jti); // invalidamos el token de MFA de facto
        return res.status(401).json({ message: 'Código inválido. Límite de intentos alcanzado, vuelva a iniciar sesión.' });
      }
      return res.status(401).json({ message: 'Código inválido' });
    }

    // Éxito: limpiamos el contador y emitimos el JWT definitivo con roles
    mfaAttemptStore.delete(jti);
    const roles = await getUserRoleNames(user.id);
    const token = signJwt({ id: user.id, email: user.email, tienda_id: user.tienda_id, roles });
    return res.json({ token, user: { id: user.id, email: user.email, nombre_completo: user.nombre_completo, tienda_id: user.tienda_id, roles } });
  } catch (err) { next(err); }
};
