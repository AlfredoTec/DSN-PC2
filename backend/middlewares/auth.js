// Middleware de autenticación por JWT
// Lee el header Authorization: Bearer <token> y adjunta los datos del usuario a req.user
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Estructura esperada: { id, email, tienda_id, roles? }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      tienda_id: decoded.tienda_id || null,
      roles: decoded.roles || [],
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
