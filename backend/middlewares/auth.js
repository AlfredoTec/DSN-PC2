// Middleware de autenticación por JWT
// Lee el header Authorization: Bearer <token> y adjunta los datos del usuario a req.user
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  try {
    // Extrae el header en formato estándar "Bearer <JWT>"
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    // Verifica la firma y expiración del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Estructura esperada firmada en controllers/auth.controller: { id, email, tienda_id, roles? }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      tienda_id: decoded.tienda_id || null,
      roles: decoded.roles || [],
    };
    return next();
  } catch (err) {
    // Falla típica: token expirado o malformado
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
