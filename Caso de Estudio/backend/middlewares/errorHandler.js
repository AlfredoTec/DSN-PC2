// Middleware de manejo de errores global
// Cualquier excepción no controlada en controladores termina aquí
module.exports = (err, req, res, next) => {
  // Log en servidor: en producción podrías integrar con un sistema de logging centralizado
  console.error(err);
  if (res.headersSent) return next(err);
  // Respuesta genérica (no exponer detalles sensibles)
  res.status(500).json({ message: 'Error interno del servidor' });
};
