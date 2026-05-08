/**
 * Controlador de autenticación y MFA.
 *
 * Incluye registro, login con bloqueo por intentos, emisión de JWT,
 * habilitación de MFA (TOTP) y verificación MFA con intentos limitados.
 */
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const prisma = require('../prisma/client');
const { signAccessToken, signTempMfaToken, verifyToken } = require('../utils/jwt');
const { generateMfaSecret, verifyTotp } = require('../utils/mfa');
const { logAction } = require('../middlewares/logger');

const MFA_ATTEMPTS = new Map(); // key: jti, value: attempts

/**
 * Extrae y normaliza errores de validación de `express-validator`.
 * @param {import('express').Request} req
 * @returns {Array<{field:string,msg:string}>|null}
 */
function extractErrors(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors.array().map((e) => ({ field: e.param, msg: e.msg }));
  }
  return null;
}

/**
 * Devuelve el perfil del usuario autenticado, incluyendo tienda y roles.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function me(req, res) {
  try {
    const u = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      include: { tienda: true },
    });
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
    const roles = await prisma.usuarioRol.findMany({ where: { usuarioId: u.id }, include: { rol: true } });
    const roleNames = roles.map((r) => r.rol.nombre);
    return res.json({
      id: u.id,
      email: u.email,
      nombreCompleto: u.nombreCompleto,
      tienda: u.tienda ? { id: u.tienda.id, nombre: u.tienda.nombre } : null,
      roles: roleNames,
      mfaHabilitado: u.mfaHabilitado,
      activo: u.activo,
      fechaCreacion: u.fechaCreacion,
    });
  } catch (e) {
    return res.status(500).json({ message: 'Error al obtener perfil' });
  }
}

/**
 * Deshabilita MFA para el usuario autenticado.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function disableMfa(req, res) {
  try {
    const me = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (!me) return res.status(404).json({ message: 'Usuario no encontrado' });
    await prisma.usuario.update({ where: { id: me.id }, data: { mfaSecret: null, mfaHabilitado: false } });
    await logAction(req, 'DESHABILITAR_MFA', `Usuario ${me.email}`, 'éxito');
    return res.json({ message: 'MFA deshabilitado' });
  } catch (e) {
    return res.status(500).json({ message: 'Error al deshabilitar MFA' });
  }
}

/**
 * Registra un nuevo usuario.
 * - Valida email, contraseña fuerte, nombre y tienda.
 * - Crea el usuario activo y le asigna por defecto el rol 'Empleado'.
 * - Registra acción de auditoría.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 201 { message }, 400 { errors|message }, 500 { message }
 */
async function register(req, res) {
  const errs = extractErrors(req);
  if (errs) return res.status(400).json({ errors: errs });

  const { email, password, nombreCompleto, tiendaId } = req.body;

  try {
    const tienda = await prisma.tienda.findUnique({ where: { id: Number(tiendaId) } });
    if (!tienda) return res.status(400).json({ message: 'tiendaId inválido' });

    const exist = await prisma.usuario.findUnique({ where: { email } });
    if (exist) return res.status(400).json({ message: 'Email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.usuario.create({
      data: {
        email,
        password: hashed,
        nombreCompleto,
        tiendaId: tienda.id,
        activo: true,
      },
    });

    const rolEmpleado = await prisma.rol.findUnique({ where: { nombre: 'Empleado' } });
    await prisma.usuarioRol.create({
      data: {
        usuarioId: user.id,
        rolId: rolEmpleado.id,
        asignadoPorId: user.id, // self asigner on auto-assign
      },
    });

    await logAction(req, 'REGISTRO_USUARIO', `Usuario ${email}`, 'éxito');
    return res.status(201).json({ message: 'Usuario registrado' });
  } catch (e) {
    return res.status(500).json({ message: 'Error en registro' });
  }
}

/**
 * Inicia sesión de usuario.
 * - Verifica credenciales.
 * - Aplica política de bloqueo tras múltiples intentos fallidos.
 * - Si el usuario no tiene MFA, retorna JWT de acceso.
 * - Si tiene MFA, retorna token temporal para verificación.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 { token|mfaRequired,tempToken }, 401 { message }, 500 { message }
 */
async function login(req, res) {
  const errs = extractErrors(req);
  if (errs) return res.status(400).json({ errors: errs });

  const { email, password } = req.body;

  try {
    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) {
      await logAction(req, 'INTENTO_LOGIN_FALLIDO', `Email ${email}`, 'fracaso');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!user.activo) {
      await logAction(req, 'INTENTO_LOGIN_FALLIDO', `Usuario inactivo ${email}`, 'fracaso');
      return res.status(401).json({ message: 'Cuenta inactiva' });
    }

    if (user.lockUntil && dayjs(user.lockUntil).isAfter(dayjs())) {
      await logAction(req, 'INTENTO_LOGIN_FALLIDO', `Usuario bloqueado ${email}`, 'fracaso');
      return res.status(401).json({ message: 'Account locked' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const attempts = (user.failedAttempts || 0) + 1;
      const update = { failedAttempts: attempts };
      if (attempts >= 5) {
        update.lockUntil = dayjs().add(15, 'minute').toDate();
        update.failedAttempts = 0;
      }
      await prisma.usuario.update({ where: { id: user.id }, data: update });
      await logAction(req, 'INTENTO_LOGIN_FALLIDO', `Email ${email}`, 'fracaso');
      return res.status(401).json({ message: attempts >= 5 ? 'Account locked' : 'Credenciales inválidas' });
    }

    // reset counters
    await prisma.usuario.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockUntil: null },
    });

    const roles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id },
      include: { rol: true },
    });
    const roleNames = roles.map((ur) => ur.rol.nombre);

    if (!user.mfaHabilitado) {
      const token = signAccessToken({ id: user.id, email: user.email, tiendaId: user.tiendaId, roles: roleNames });
      await logAction(req, 'LOGIN', `Usuario ${email}`, 'éxito');
      return res.json({ token, mfaRequired: false });
    }

    const tempToken = signTempMfaToken({ id: user.id, email: user.email });
    const { jti } = require('jsonwebtoken').decode(tempToken);
    MFA_ATTEMPTS.set(jti, 0);

    await logAction(req, 'LOGIN_MFA_REQUERIDO', `Usuario ${email}`, 'éxito');
    return res.json({ mfaRequired: true, tempToken });
  } catch (e) {
    return res.status(500).json({ message: 'Error en login' });
  }
}

/**
 * Habilita MFA (TOTP) para el usuario autenticado.
 * - Genera secreto TOTP y lo guarda asociado al usuario.
 * - Devuelve la URL otpauth y la clave base32.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 { otpauth_url, secret }, 500 { message }
 */
async function enableMfa(req, res) {
  try {
    const me = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    const secret = generateMfaSecret(me.email);
    await prisma.usuario.update({
      where: { id: me.id },
      data: { mfaSecret: secret.base32, mfaHabilitado: false },
    });
    await logAction(req, 'HABILITAR_MFA', `Usuario ${me.email}`, 'éxito');
    return res.json({ otpauth_url: secret.otpauth_url, secret: secret.base32 });
  } catch (e) {
    return res.status(500).json({ message: 'Error al habilitar MFA' });
  }
}

/**
 * Confirma la configuración MFA verificando un código TOTP para el usuario autenticado.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 { message }, 400/500 { message }
 */
async function confirmMfaSetup(req, res) {
  const { codigoTOTP } = req.body;
  if (!codigoTOTP) return res.status(400).json({ message: 'codigoTOTP requerido' });

  try {
    const me = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (!me?.mfaSecret) return res.status(400).json({ message: 'Primero genera un secreto MFA' });

    const ok = verifyTotp(String(codigoTOTP), me.mfaSecret);
    if (!ok) {
      await logAction(req, 'CONFIRMAR_MFA', `Usuario ${me.email}`, 'fracaso');
      return res.status(400).json({ message: 'Código MFA inválido' });
    }

    await prisma.usuario.update({
      where: { id: me.id },
      data: { mfaHabilitado: true },
    });
    await logAction(req, 'CONFIRMAR_MFA', `Usuario ${me.email}`, 'éxito');
    return res.json({ message: 'MFA verificado y activado' });
  } catch (e) {
    return res.status(500).json({ message: 'Error al verificar MFA' });
  }
}

/**
 * Verifica un código TOTP válido y emite un JWT de acceso.
 * - Controla intentos máximos por token temporal (3).
 * - Al verificar, limpia el contador y devuelve token de acceso completo.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 { token, mfaRequired:false }, 400/401 { message }
 */
async function verifyMfa(req, res) {
  const errs = extractErrors(req);
  if (errs) return res.status(400).json({ errors: errs });

  const { tempToken, codigoTOTP } = req.body;

  try {
    const payload = verifyToken(tempToken);
    if (payload.type !== 'mfa') return res.status(400).json({ message: 'Token MFA inválido' });

    const jti = require('jsonwebtoken').decode(tempToken)?.jti;
    const used = MFA_ATTEMPTS.get(jti) || 0;
    if (used >= 3) {
      return res.status(401).json({ message: 'MFA inválido: token caducado' });
    }

    const user = await prisma.usuario.findUnique({ where: { id: payload.sub } });
    if (!user || !user.mfaSecret) return res.status(400).json({ message: 'MFA no habilitado' });

    const ok = verifyTotp(String(codigoTOTP), user.mfaSecret);

    if (!ok) {
      const n = used + 1;
      if (n >= 3) {
        MFA_ATTEMPTS.set(jti, 3);
        await logAction(req, 'VERIFICAR_MFA', `Usuario ${user.email}`, 'fracaso');
        return res.status(401).json({ message: 'MFA inválido: token caducado' });
      }
      MFA_ATTEMPTS.set(jti, n);
      return res.status(401).json({ message: 'Código MFA incorrecto' });
    }

    // success
    MFA_ATTEMPTS.delete(jti);
    const roles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id },
      include: { rol: true },
    });
    const roleNames = roles.map((ur) => ur.rol.nombre);
    const token = signAccessToken({ id: user.id, email: user.email, tiendaId: user.tiendaId, roles: roleNames });
    await logAction(req, 'VERIFICAR_MFA', `Usuario ${user.email}`, 'éxito');
    return res.json({ token, mfaRequired: false });
  } catch (e) {
    return res.status(401).json({ message: 'Token MFA inválido o expirado' });
  }
}

module.exports = { register, login, enableMfa, confirmMfaSetup, verifyMfa, me, disableMfa };
