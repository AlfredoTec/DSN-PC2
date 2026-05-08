// Middleware ABAC para Productos
// Aplica reglas de acceso por atributos según rol, tienda del usuario y atributos del producto
// Reglas resumidas:
// - SELECT: Admin/Auditor -> todos; Gerente/Empleado -> solo su tienda
// - INSERT: Admin -> cualquiera; Gerente -> solo en su tienda; Empleado -> solo NO premium en su tienda; Auditor -> sin acceso
// - UPDATE: Admin -> cualquier campo; Gerente -> cualquier campo en su tienda excepto categoria; Empleado -> solo stock en su tienda; Auditor -> sin acceso
// - DELETE: Admin -> cualquiera; Gerente -> solo NO premium en su tienda; Empleado/Auditor -> sin acceso

const prisma = require('../prisma/client');

function hasRole(user, roleName) {
  return (user.roles || []).includes(roleName);
}

function logAbac(user, action, details = {}) {
  const ts = new Date().toISOString();
  // Log simple a consola con datos relevantes
  console.log('[ABAC]', ts, {
    userId: user.id,
    roles: user.roles,
    tienda_id: user.tienda_id,
    action,
    ...details,
  });
}

// SELECT (listado): inyecta un filtro where en req.abac.where según el rol
exports.listPolicy = (req, res, next) => {
  const user = req.user;
  const isAdmin = hasRole(user, 'Admin');
  const isAuditor = hasRole(user, 'Auditor');
  const isGerente = hasRole(user, 'Gerente');
  const isEmpleado = hasRole(user, 'Empleado');

  const where = {};
  if (isAdmin || isAuditor) {
    // sin restricciones por tienda
  } else if (isGerente || isEmpleado) {
    // restringir a su tienda
    if (!user.tienda_id) return res.status(403).json({ message: 'Usuario sin tienda asignada' });
    where.tienda_id = user.tienda_id;
  } else {
    // Sin rol conocido: denegar
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  // req.abac.where transporta el filtro a aplicar en la capa de datos (controllers -> Prisma)
  req.abac = { where };
  logAbac(user, 'PRODUCT_LIST', { where });
  next();
};

// SELECT (detalle): verifica acceso a un producto por id
exports.getOnePolicy = async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;
  const isAdmin = hasRole(user, 'Admin');
  const isAuditor = hasRole(user, 'Auditor');
  const isGerente = hasRole(user, 'Gerente');
  const isEmpleado = hasRole(user, 'Empleado');

  const prod = await prisma.producto.findUnique({ where: { id: Number(id) } });
  if (!prod) return res.status(404).json({ message: 'Producto no encontrado' });

  if (isAdmin || isAuditor) {
    // req.product pasa el recurso autorizado al controlador para evitar releerlo sin control
    req.product = prod;
    logAbac(user, 'PRODUCT_VIEW', { id: prod.id, tienda_id: prod.tienda_id });
    return next();
  }
  if (isGerente || isEmpleado) {
    if (!user.tienda_id) return res.status(403).json({ message: 'Usuario sin tienda asignada' });
    if (prod.tienda_id !== user.tienda_id) return res.status(403).json({ message: 'Acceso denegado a producto de otra tienda' });
    req.product = prod;
    logAbac(user, 'PRODUCT_VIEW', { id: prod.id, tienda_id: prod.tienda_id });
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado' });
};

// INSERT: valida reglas y normaliza body según el rol
exports.createPolicy = (req, res, next) => {
  const user = req.user;
  const body = req.body || {};
  const isAdmin = hasRole(user, 'Admin');
  const isGerente = hasRole(user, 'Gerente');
  const isEmpleado = hasRole(user, 'Empleado');
  const isAuditor = hasRole(user, 'Auditor');

  if (isAuditor) return res.status(403).json({ message: 'Acceso denegado' });

  if (isAdmin) {
    logAbac(user, 'PRODUCT_CREATE_ATTEMPT', { tienda_id: body.tienda_id, es_premium: body.es_premium });
    return next();
  }

  if (!user.tienda_id) return res.status(403).json({ message: 'Usuario sin tienda asignada' });

  if (isGerente) {
    // fuerza a su tienda
    req.body.tienda_id = user.tienda_id;
    logAbac(user, 'PRODUCT_CREATE_ATTEMPT', { tienda_id: req.body.tienda_id, es_premium: req.body.es_premium });
    return next();
  }

  if (isEmpleado) {
    // solo productos NO premium en su tienda
    if (req.body.es_premium === true) return res.status(403).json({ message: 'Empleado no puede crear productos premium' });
    req.body.es_premium = false; // fuerza no premium
    req.body.tienda_id = user.tienda_id; // fuerza tienda
    logAbac(user, 'PRODUCT_CREATE_ATTEMPT', { tienda_id: req.body.tienda_id, es_premium: req.body.es_premium });
    return next();
  }

  return res.status(403).json({ message: 'Acceso denegado' });
};

// UPDATE: valida acceso y campos permitidos según rol
exports.updatePolicy = async (req, res, next) => {
  const user = req.user;
  const isAdmin = hasRole(user, 'Admin');
  const isGerente = hasRole(user, 'Gerente');
  const isEmpleado = hasRole(user, 'Empleado');
  const isAuditor = hasRole(user, 'Auditor');
  const { id } = req.params;

  const prod = await prisma.producto.findUnique({ where: { id: Number(id) } });
  if (!prod) return res.status(404).json({ message: 'Producto no encontrado' });

  if (isAuditor) return res.status(403).json({ message: 'Acceso denegado' });

  // Admin: puede todo
  if (isAdmin) {
    req.product = prod;
    // req.abacUpdate permite a controller saber si debe filtrar campos (Empleado) o aplicar todo (Admin/Gerente validado)
    req.abacUpdate = { allowedFields: 'ALL' };
    logAbac(user, 'PRODUCT_UPDATE_ATTEMPT', { id: prod.id });
    return next();
  }

  if (!user.tienda_id) return res.status(403).json({ message: 'Usuario sin tienda asignada' });
  if (prod.tienda_id !== user.tienda_id) return res.status(403).json({ message: 'No puede modificar productos de otra tienda' });

  if (isGerente) {
    // Todos los campos excepto categoria, y no permitir cambiar tienda_id fuera de su tienda
    if ('categoria' in req.body) return res.status(403).json({ message: 'Gerente no puede modificar la categoria' });
    if ('tienda_id' in req.body && req.body.tienda_id !== user.tienda_id) {
      return res.status(403).json({ message: 'Gerente no puede cambiar tienda_id a otra tienda' });
    }
    req.abacUpdate = { allowedFields: 'ALL_EXCEPT_CATEGORIA', tienda_id: user.tienda_id };
    req.product = prod;
    logAbac(user, 'PRODUCT_UPDATE_ATTEMPT', { id: prod.id });
    return next();
  }

  if (isEmpleado) {
    // Solo campo stock
    const keys = Object.keys(req.body || {});
    const onlyStock = keys.length === 1 && keys[0] === 'stock';
    if (!onlyStock) return res.status(403).json({ message: 'Empleado solo puede actualizar el stock' });
    req.abacUpdate = { allowedFields: ['stock'] };
    req.product = prod;
    logAbac(user, 'PRODUCT_UPDATE_ATTEMPT', { id: prod.id, fields: ['stock'] });
    return next();
  }

  return res.status(403).json({ message: 'Acceso denegado' });
};

// DELETE: valida acceso según rol y atributos
exports.deletePolicy = async (req, res, next) => {
  const user = req.user;
  const isAdmin = hasRole(user, 'Admin');
  const isGerente = hasRole(user, 'Gerente');
  const isEmpleado = hasRole(user, 'Empleado');
  const isAuditor = hasRole(user, 'Auditor');
  const { id } = req.params;

  const prod = await prisma.producto.findUnique({ where: { id: Number(id) } });
  if (!prod) return res.status(404).json({ message: 'Producto no encontrado' });

  if (isAdmin) {
    req.product = prod;
    logAbac(user, 'PRODUCT_DELETE_ATTEMPT', { id: prod.id });
    return next();
  }

  if (isGerente) {
    if (!user.tienda_id) return res.status(403).json({ message: 'Usuario sin tienda asignada' });
    if (prod.tienda_id !== user.tienda_id) return res.status(403).json({ message: 'No puede eliminar productos de otra tienda' });
    if (prod.es_premium) return res.status(403).json({ message: 'No puede eliminar productos premium' });
    req.product = prod;
    logAbac(user, 'PRODUCT_DELETE_ATTEMPT', { id: prod.id });
    return next();
  }

  if (isEmpleado || isAuditor) return res.status(403).json({ message: 'Acceso denegado' });

  return res.status(403).json({ message: 'Acceso denegado' });
};
