/**
 * Middleware de autorización por rol (RBAC).
 * Permite el paso si el usuario tiene al menos uno de los `rolesPermitidos`.
 * @param {string[]} rolesPermitidos
 */
function checkRole(rolesPermitidos = []) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const ok = rolesPermitidos.some((r) => userRoles.includes(r));
    if (!ok) return res.status(403).json({ message: 'No tienes permisos de Administrador' });
    next();
  };
}

module.exports = { checkRole };
