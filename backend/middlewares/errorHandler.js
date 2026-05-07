// Middleware de manejo de errores global
// Cualquier excepción no controlada en controladores termina aquí
module.exports = (err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ message: 'Error interno del servidor' });
};
