// Script de prueba de conexión a la base de datos usando Prisma
// Usa variables de entorno del .env (DATABASE_PUBLIC_URL o DATABASE_URL)
require('dotenv').config();
const prisma = require('./prisma/client');

(async () => {
  try {
    console.log('Intentando conectar a la base de datos (Prisma)...');
    await prisma.$connect();
    console.log('Conexión establecida correctamente.');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
