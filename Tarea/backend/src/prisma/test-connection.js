/* eslint-disable no-console */
/**
 * Script auxiliar para probar la conexión a la base de datos.
 * Ejecuta consultas simples para verificar tablas mínimas.
 */
require('dotenv').config();
const prisma = require('./client');

(async function testConnection() {
  try {
    // Verifica conexión y existencia de tablas mínimas
    const tiendas = await prisma.tienda.findMany({ take: 1 });
    const roles = await prisma.rol.findMany({ take: 1 });

    console.log('[DB TEST] Conexión OK');
    console.log(`[DB TEST] Tablas: tiendas(${tiendas.length}), roles(${roles.length})`);

    process.exit(0);
  } catch (e) {
    console.error('[DB TEST] Error de conexión o migración pendiente:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
