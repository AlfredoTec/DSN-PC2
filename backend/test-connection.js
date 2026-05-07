// Script de prueba de conexión a la base de datos usando Sequelize
// Usa variables de entorno del .env
require('dotenv').config();
const { sequelize } = require('./config/database');

(async () => {
  try {
    console.log('Intentando conectar a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión establecida correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
