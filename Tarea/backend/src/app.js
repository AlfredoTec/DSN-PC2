/**
 * App principal de Express para la API de TechStore.
 *
 * Responsabilidades:
 * - Cargar variables de entorno.
 * - Configurar middlewares globales de seguridad (helmet), CORS, parseo JSON y logging HTTP.
 * - Montar los routers de cada dominio (/auth, /roles, /usuarios, /productos, /usuario-roles, /tiendas).
 * - Exponer un endpoint de health-check y un manejador 404 por defecto.
 *
 * Este módulo solo construye y exporta la instancia de `app`.
 * El arranque del servidor (listen) ocurre en `src/server.js`.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const rolRoutes = require('./routes/rolRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const productoRoutes = require('./routes/productoRoutes');
const usuarioRolRoutes = require('./routes/usuarioRolRoutes');
const tiendaRoutes = require('./routes/tiendaRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// Habilita CORS para permitir peticiones desde el frontend
app.use(cors());
// Cabeceras de seguridad por defecto (XSS, MIME sniffing, etc.)
app.use(helmet());
// Parseo de cuerpos JSON en requests entrantes
app.use(express.json());
// Logging HTTP en formato de desarrollo
app.use(morgan('dev'));

// Rutas de la API (se montan por dominio)
app.use('/api/auth', authRoutes); // Autenticación, login, MFA
app.use('/api/roles', rolRoutes); // Administración de roles (RBAC)
app.use('/api/usuarios', usuarioRoutes); // Gestión de usuarios
app.use('/api/productos', productoRoutes); // Gestión de productos (con ABAC)
app.use('/api/usuario-roles', usuarioRolRoutes); // Asignación/eliminación de roles a usuarios
app.use('/api/tiendas', tiendaRoutes); // Listado de tiendas (catálogo)
app.use('/api/public', publicRoutes); // Rutas públicas (sin auth)

// Endpoint de verificación de vida del servicio
app.get('/health', (req, res) => res.json({ ok: true }));

// Manejador 404 por defecto cuando no coincide ninguna ruta
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

module.exports = app;
