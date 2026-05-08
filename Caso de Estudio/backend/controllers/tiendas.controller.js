// Controlador de Tiendas: listado simple para poblar dropdowns en el frontend
const prisma = require('../prisma/client');

/**
 * GET /api/tiendas
 * Lista tiendas con un subconjunto de campos útil para dropdowns.
 * @param {import('express').Request} req
 * @param {import('express').Response} res - 200 Array<{ id: number, nombre: string, ubicacion: string }>
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
exports.list = async (req, res, next) => {
  try {
    const tiendas = await prisma.tienda.findMany({
      select: { id: true, nombre: true, ubicacion: true }
    });
    res.json(tiendas);
  } catch (err) { next(err); }
};
