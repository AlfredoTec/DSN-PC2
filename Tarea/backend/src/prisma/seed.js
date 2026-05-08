/* eslint-disable no-console */
/**
 * Script de seed para entorno local/desarrollo.
 * Crea tiendas, roles por defecto, un usuario admin y productos de ejemplo.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./client');

async function main() {
  // Tiendas
  const tiendas = ['Lima', 'Arequipa', 'Cusco'];
  for (const nombre of tiendas) {
    try {
      await prisma.tienda.upsert({
        where: { nombre },
        update: {},
        create: { nombre },
      });
      console.log(`Tienda '${nombre}' OK`);
    } catch (e) {
      console.warn(`Tienda '${nombre}' fallo/omitida: ${e.message}`);
    }
  }

  // Roles
  const defaultRoles = [
    { nombre: 'Administrador', descripcion: 'Acceso total al sistema' },
    { nombre: 'Gerente', descripcion: 'Gestión de su tienda' },
    { nombre: 'Empleado', descripcion: 'Operaciones básicas de su tienda' },
    { nombre: 'Auditor', descripcion: 'Solo lectura global' },
  ];
  for (const r of defaultRoles) {
    try {
      await prisma.rol.upsert({
        where: { nombre: r.nombre },
        update: { descripcion: r.descripcion },
        create: r,
      });
      console.log(`Rol '${r.nombre}' OK`);
    } catch (e) {
      console.warn(`Rol '${r.nombre}' fallo/omitido: ${e.message}`);
    }
  }

  // Usuario administrador por defecto
  const adminEmail = 'admin@techstore.com';
  const adminPass = await bcrypt.hash('Admin123!', 10);
  const demoPass = await bcrypt.hash('Demo123!', 10);
  const lima = await prisma.tienda.findUnique({ where: { nombre: 'Lima' } });

  const admin = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPass,
      nombreCompleto: 'Administrador Principal',
      tiendaId: lima.id,
      activo: true,
    },
  });

  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'Administrador' } });
  await prisma.usuarioRol.upsert({
    where: { usuarioId_rolId: { usuarioId: admin.id, rolId: rolAdmin.id } },
    update: {},
    create: {
      usuarioId: admin.id,
      rolId: rolAdmin.id,
      asignadoPorId: admin.id,
    },
  });

  // Crear un usuario por rol en cada tienda (Administrador, Gerente, Empleado, Auditor)
  const rolGerente = await prisma.rol.findUnique({ where: { nombre: 'Gerente' } });
  const rolEmpleado = await prisma.rol.findUnique({ where: { nombre: 'Empleado' } });
  const rolAuditor = await prisma.rol.findUnique({ where: { nombre: 'Auditor' } });

  const tiendasAll = await prisma.tienda.findMany({ where: { nombre: { in: tiendas } } });

  function aliasRol(nombre) {
    if (nombre === 'Administrador') return 'admin';
    if (nombre === 'Gerente') return 'gerente';
    if (nombre === 'Empleado') return 'empleado';
    if (nombre === 'Auditor') return 'auditor';
    return nombre.toLowerCase();
  }

  const rolesList = [
    { id: rolAdmin.id, nombre: 'Administrador' },
    { id: rolGerente.id, nombre: 'Gerente' },
    { id: rolEmpleado.id, nombre: 'Empleado' },
    { id: rolAuditor.id, nombre: 'Auditor' },
  ];

  for (const t of tiendasAll) {
    for (const r of rolesList) {
      try {
        const email = `${aliasRol(r.nombre)}.${t.nombre.toLowerCase()}@techstore.com`;
        const user = await prisma.usuario.upsert({
          where: { email },
          update: {},
          create: {
            email,
            password: demoPass,
            nombreCompleto: `${r.nombre} ${t.nombre}`,
            tiendaId: t.id,
            activo: true,
          },
        });
        await prisma.usuarioRol.upsert({
          where: { usuarioId_rolId: { usuarioId: user.id, rolId: r.id } },
          update: {},
          create: {
            usuarioId: user.id,
            rolId: r.id,
            asignadoPorId: admin.id,
          },
        });
        console.log(`Usuario demo '${email}' (${r.nombre}) en tienda '${t.nombre}' OK`);
      } catch (e) {
        console.warn(`Usuario demo (${r.nombre} - ${t.nombre}) omitido: ${e.message}`);
      }
    }
  }

  // Productos de ejemplo
  const arequipa = await prisma.tienda.findUnique({ where: { nombre: 'Arequipa' } });
  const cusco = await prisma.tienda.findUnique({ where: { nombre: 'Cusco' } });

  const samples = [
    { nombre: 'Laptop HP', descripcion: 'i7 16GB RAM', precio: 3500, stock: 12, categoria: 'Laptops', tiendaId: lima.id, esPremium: true },
    { nombre: 'Mouse Logitech', descripcion: 'Inalámbrico', precio: 120, stock: 80, categoria: 'Periféricos', tiendaId: lima.id, esPremium: false },
    { nombre: 'Monitor Samsung', descripcion: '27" 4K', precio: 900, stock: 25, categoria: 'Monitores', tiendaId: arequipa.id, esPremium: true },
    { nombre: 'Teclado Mecánico', descripcion: 'Switch rojo', precio: 250, stock: 40, categoria: 'Periféricos', tiendaId: cusco.id, esPremium: false }
  ];

  for (const p of samples) {
    try {
      const exists = await prisma.producto.findFirst({ where: { nombre: p.nombre, tiendaId: p.tiendaId } });
      if (exists) {
        console.log(`Producto '${p.nombre}' ya existe en tiendaId=${p.tiendaId}, omitido.`);
        continue;
      }
      await prisma.producto.create({ data: { ...p, creadoPorId: admin.id } });
      console.log(`Producto '${p.nombre}' creado.`);
    } catch (e) {
      console.warn(`Producto '${p.nombre}' fallo/omitido: ${e.message}`);
    }
  }

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
