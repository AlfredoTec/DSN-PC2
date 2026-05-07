// Seeder: crea roles iniciales, tienda "Central", usuario admin y (opcional) un producto de ejemplo
// Ejecutar con: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const Rol = require('../models/Rol');
const Tienda = require('../models/Tienda');
const Usuario = require('../models/Usuario');
const UsuarioRol = require('../models/UsuarioRol');
const Producto = require('../models/Producto');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    // Crea roles si no existen
    const roleNames = [
      { nombre: 'Admin', descripcion: 'Acceso total' },
      { nombre: 'Gerente', descripcion: 'Gestiona su tienda' },
      { nombre: 'Empleado', descripcion: 'Opera stock en su tienda' },
      { nombre: 'Auditor', descripcion: 'Solo lectura' },
    ];

    for (const r of roleNames) {
      await Rol.findOrCreate({ where: { nombre: r.nombre }, defaults: { descripcion: r.descripcion } });
    }

    // Crea tienda "Central" si no existe
    const [central] = await Tienda.findOrCreate({ where: { nombre: 'Central' }, defaults: { ubicacion: 'Sede Central' } });

    // Crea usuario admin por defecto si no existe
    const adminEmail = 'admin@techstore.com';
    let admin = await Usuario.findOne({ where: { email: adminEmail } });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Admin123!', salt);
      admin = await Usuario.create({
        email: adminEmail,
        password: hash,
        nombre_completo: 'Administrador TechStore',
        tienda_id: central.id,
        mfa_habilitado: false,
        activo: true,
      });
    }

    // Asigna rol Admin al usuario administrador
    const rolAdmin = await Rol.findOne({ where: { nombre: 'Admin' } });
    await UsuarioRol.findOrCreate({ where: { usuario_id: admin.id, rol_id: rolAdmin.id }, defaults: { asignado_por: admin.id } });

    // Producto de ejemplo (opcional) para probar ABAC
    await Producto.findOrCreate({
      where: { nombre: 'Laptop Pro 15' },
      defaults: {
        descripcion: 'Equipo de alto desempeño',
        precio: 1999.99,
        stock: 10,
        categoria: 'Computadoras',
        tienda_id: central.id,
        es_premium: true,
        creado_por: admin.id,
      }
    });

    console.log('Seed completado');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err);
    process.exit(1);
  }
})();
