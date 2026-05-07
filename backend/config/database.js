// Conexión Sequelize para PostgreSQL
// Prioriza DATABASE_PUBLIC_URL o DATABASE_URL (formato URI), y cae a variables discretas DB_*
const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

let sequelize;
if (databaseUrl) {
  // Usando cadena de conexión completa (Railway u otro proveedor)
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // necesario para Railway
      },
    },
  });
} else {
  // Fallback a variables discretas
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: process.env.DB_DIALECT || 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // necesario para Railway
        },
      },
    }
  );
}

module.exports = { sequelize };
