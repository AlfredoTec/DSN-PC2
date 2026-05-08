/**
 * Middleware de autenticación por JWT.
 * - Extrae el token del header Authorization Bearer.
 * - Verifica firma y tipo de token.
 * - Propaga `req.user` con id, email, tiendaId y roles.
 */
const { verifyToken } = require('../utils/jwt');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function auth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const [, token] = hdr.split(' ');
    if (!token) return res.status(401).json({ message: 'No autorizado' });
    const payload = verifyToken(token);
    if (payload.type !== 'access') return res.status(401).json({ message: 'Token inválido' });
    req.user = {
      id: payload.sub,
      email: payload.email,
      tiendaId: payload.tiendaId,
      roles: payload.roles || [],
    };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

module.exports = auth;
