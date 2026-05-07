// Middleware RBAC: verifica si el usuario (en req.user.roles) posee al menos uno de los roles permitidos
module.exports = function authorizeRoles(...allowed) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const ok = userRoles.some(r => allowed.includes(r));
    if (!ok) return res.status(403).json({ message: 'Acceso denegado: rol insuficiente' });
    next();
  };
};
