/**
 * Middleware ABAC (Control de Acceso Basado en Atributos) para productos.
 * Evalúa permisos en base a rol, tienda y atributos específicos de la entidad/operación.
 */
const prisma = require('../prisma/client');
const { policyEngine } = require('../utils/policyEngine');

/**
 * Genera un middleware que valida la acción ABAC solicitada.
 * @param {'create'|'read'|'update'|'delete'} action
 */
function checkAbac(action) {
  return async (req, res, next) => {
    try {
      if (action === 'create') {
        const evalRes = policyEngine(req.user, 'create', req.body);
        if (!evalRes.allowed) return res.status(403).json({ message: evalRes.reason || 'Acceso denegado' });
        return next();
      }

      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

      const product = await prisma.producto.findUnique({ where: { id } });
      if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

      if (action === 'read') {
        const evalRes = policyEngine(req.user, 'read', product);
        if (!evalRes.allowed) return res.status(403).json({ message: evalRes.reason || 'Acceso denegado' });
        req.product = product;
        return next();
      }

      if (action === 'update') {
        const updateFields = Object.keys(req.body || {});
        const evalRes = policyEngine(req.user, 'update', product, updateFields);
        if (!evalRes.allowed) return res.status(403).json({ message: evalRes.reason || 'Acceso denegado' });
        req.product = product;
        req.abac = { allowedFields: evalRes.allowedFields || updateFields };
        return next();
      }

      if (action === 'delete') {
        const evalRes = policyEngine(req.user, 'delete', product);
        if (!evalRes.allowed) return res.status(403).json({ message: evalRes.reason || 'Acceso denegado' });
        req.product = product;
        return next();
      }

      return res.status(400).json({ message: 'Acción ABAC inválida' });
    } catch (e) {
      return res.status(500).json({ message: 'Error ABAC' });
    }
  };
}

module.exports = { checkAbac };
