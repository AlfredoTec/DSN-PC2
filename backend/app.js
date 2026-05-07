// Carga variables de entorno desde .env
require('dotenv').config();
// Framework Express para crear la API REST
const express = require('express');
// CORS para permitir peticiones desde el frontend
const cors = require('cors');
// Conexión a la base de datos con Sequelize
const { sequelize } = require('./config/database');
// Rutas de autenticación (registro, login, MFA)
const authRoutes = require('./routes/auth.routes');
// Rutas de roles (CRUD con RBAC)
const roleRoutes = require('./routes/roles.routes');
// Rutas de usuarios (gestión y asignación de roles)
const userRoutes = require('./routes/usuarios.routes');
// Middleware de manejo global de errores
const errorHandler = require('./middlewares/errorHandler');
// Rutas de productos (CRUD con ABAC)
const productRoutes = require('./routes/productos.routes');

const app = express();
app.use(cors());
// Habilita parseo de JSON en el body
app.use(express.json());

// Endpoint de verificación simple para comprobar que el servidor está activo
app.get('/', (req, res) => {
  res.json({ message: 'TechStore Auth API - Partes 1 y 2 (MFA TOTP)' });
});

// Prefijo de rutas de autenticación
app.use('/api/auth', authRoutes);
// Prefijo de rutas de roles
app.use('/api/roles', roleRoutes);
// Prefijo de rutas de usuarios
app.use('/api/usuarios', userRoutes);
// Prefijo de rutas de productos
app.use('/api/productos', productRoutes);

// Middleware de errores al final del pipeline
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Inicializa la conexión a la BD y arranca el servidor HTTP
(async () => {
  try {
    await sequelize.authenticate(); // Verifica credenciales y conectividad
    console.log('DB connection established');
    await sequelize.sync(); // Sincroniza modelos con la BD (crea tablas si no existen)
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Unable to start server', err);
    process.exit(1);
  }
})();
