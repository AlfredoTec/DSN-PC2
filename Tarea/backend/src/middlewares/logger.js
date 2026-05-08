/**
 * Utilidad de auditoría: registra acciones del usuario en la tabla LogAccion.
 * No debe interrumpir el flujo de la aplicación en caso de error.
 */
const prisma = require('../prisma/client');

/**
 * Registra una acción de auditoría con metadatos básicos.
 * @param {import('express').Request} req
 * @param {string} accion
 * @param {string} recurso
 * @param {string} resultado
 */
async function logAction(req, accion, recurso, resultado) {
  try {
    await prisma.logAccion.create({
      data: {
        usuarioId: req.user?.id || null,
        accion,
        recurso,
        resultado,
        ip: req.ip,
      },
    });
  } catch (e) {
    // evitar romper flujo por logging
  }
}

module.exports = { logAction };
