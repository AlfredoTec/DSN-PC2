/**
 * Controlador de tiendas: expone listado básico de sucursales.
 */
const prisma = require('../prisma/client');

/**
 * Devuelve lista de tiendas ordenadas por nombre (solo id y nombre).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 * Respuestas: 200 Array<{ id:number, nombre:string }>, 500 { message }
 */
async function listTiendas(req, res) {
  try {
    const tiendas = await prisma.tienda.findMany({ orderBy: { nombre: 'asc' } });
    return res.json(tiendas.map(t => ({ id: t.id, nombre: t.nombre })));
  } catch (e) {
    return res.status(500).json({ message: 'Error al listar tiendas' });
  }
}

module.exports = { listTiendas };
