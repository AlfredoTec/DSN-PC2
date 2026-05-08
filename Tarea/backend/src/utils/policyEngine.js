/**
 * Verifica si el usuario posee un rol por nombre.
 * @param {{roles?: string[]}} user
 * @param {string} roleName
 */
function hasRole(user, roleName) {
  return Array.isArray(user.roles) && user.roles.includes(roleName);
}

/**
 * Motor de políticas ABAC para productos.
 * Evalúa permisos de create/read/update/delete según rol del usuario,
 * tienda y, en updates, restringe campos permitidos.
 * @param {{roles:string[], tiendaId?: number}} user
 * @param {'create'|'read'|'update'|'delete'} action
 * @param {any} productOrData
 * @param {string[]} [updateFields]
 */
function policyEngine(user, action, productOrData, updateFields = []) {
  const isAdmin = hasRole(user, 'Administrador');
  const isManager = hasRole(user, 'Gerente');
  const isEmployee = hasRole(user, 'Empleado');
  const isAuditor = hasRole(user, 'Auditor');

  if (action === 'read') {
    if (isAdmin || isAuditor) return { allowed: true };
    if (isManager || isEmployee) {
      if (!productOrData) return { allowed: true }; // lista será filtrada por tienda en DB
      return { allowed: productOrData.tiendaId === user.tiendaId, reason: 'Solo puedes acceder a productos de tu tienda.' };
    }
    return { allowed: false, reason: 'Acceso no permitido.' };
  }

  if (action === 'create') {
    const data = productOrData || {};
    if (isAdmin) return { allowed: true };
    if (isManager) {
      return { allowed: data.tiendaId === user.tiendaId, reason: 'Gerente solo puede crear en su tienda.' };
    }
    if (isEmployee) {
      return { allowed: false, reason: 'Empleado no puede crear productos.' };
    }
    if (isAuditor) return { allowed: false, reason: 'Auditor no puede crear productos.' };
    return { allowed: false };
  }

  if (action === 'update') {
    const p = productOrData;
    if (!p) return { allowed: false, reason: 'Producto no encontrado.' };
    if (isAdmin) return { allowed: true, allowedFields: updateFields };
    if (isManager) {
      if (p.tiendaId !== user.tiendaId) return { allowed: false, reason: 'Gerente solo puede actualizar productos de su tienda.' };
      const forbidden = new Set(['categoria', 'tiendaId']);
      const filtered = updateFields.filter((f) => !forbidden.has(f));
      if (filtered.length === 0 && updateFields.length > 0) {
        return { allowed: false, reason: 'No puedes modificar tienda ni categoría.' };
      }
      return { allowed: true, allowedFields: filtered };
    }
    if (isEmployee) {
      if (p.tiendaId !== user.tiendaId) return { allowed: false, reason: 'Empleado solo puede actualizar productos de su tienda.' };
      const filtered = updateFields.filter((f) => f === 'stock');
      if (filtered.length === 0) return { allowed: false, reason: 'Empleado solo puede actualizar stock.' };
      return { allowed: true, allowedFields: filtered };
    }
    if (isAuditor) return { allowed: false, reason: 'Auditor no puede actualizar productos.' };
    return { allowed: false };
  }

  if (action === 'delete') {
    const p = productOrData;
    if (!p) return { allowed: false, reason: 'Producto no encontrado.' };
    if (isAdmin) return { allowed: true };
    if (isManager) {
      if (p.tiendaId !== user.tiendaId) return { allowed: false, reason: 'Gerente solo puede eliminar productos de su tienda.' };
      if (p.esPremium) return { allowed: false, reason: 'Gerente no puede eliminar productos premium.' };
      return { allowed: true };
    }
    if (isEmployee) return { allowed: false, reason: 'Empleado no puede eliminar productos.' };
    if (isAuditor) return { allowed: false, reason: 'Auditor no puede eliminar productos.' };
    return { allowed: false };
  }

  return { allowed: false, reason: 'Acción no soportada.' };
}

module.exports = { policyEngine, hasRole };
