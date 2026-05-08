/**
 * Utilidades para emisión y verificación de JWT.
 * - `signAccessToken`: emite un token de acceso con roles y tienda.
 * - `signTempMfaToken`: emite un token temporal para MFA (5 minutos, con jti aleatorio).
 * - `verifyToken`: verifica y decodifica cualquier JWT usando la misma clave.
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Emite un JWT de acceso con payload del usuario autenticado.
 * @param {{id:number,email:string,tiendaId:number,roles:string[]}} user
 */
function signAccessToken(user) {
  const payload = {
    type: 'access',
    sub: user.id,
    email: user.email,
    tiendaId: user.tiendaId,
    roles: user.roles, // array de nombres
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

/**
 * Emite un JWT temporal para MFA.
 * @param {{id:number,email:string}} user
 */
function signTempMfaToken(user) {
  const payload = { type: 'mfa', sub: user.id, email: user.email };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '5m',
    jwtid: crypto.randomBytes(8).toString('hex'),
  });
}

/**
 * Verifica la firma del token y retorna su payload.
 * Lanza si el token es inválido o expiró.
 * @param {string} token
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signAccessToken,
  signTempMfaToken,
  verifyToken,
};
