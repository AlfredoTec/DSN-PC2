// Prisma seeder: crea roles iniciales, tienda "Central", usuario admin y un producto de ejemplo
require('dotenv').config()
const bcrypt = require('bcryptjs')
const prisma = require('./client')

async function main() {
  // Roles base
  const roleNames = [
    { nombre: 'Admin', descripcion: 'Acceso total' },
    { nombre: 'Gerente', descripcion: 'Gestiona su tienda' },
    { nombre: 'Empleado', descripcion: 'Opera stock en su tienda' },
    { nombre: 'Auditor', descripcion: 'Solo lectura' },
  ]

  for (const r of roleNames) {
    const exists = await prisma.rol.findUnique({ where: { nombre: r.nombre } })
    if (exists) {
      console.log(`[seed] Rol ya existía, se omite creación: ${r.nombre}`)
    } else {
      await prisma.rol.create({ data: { nombre: r.nombre, descripcion: r.descripcion } })
      console.log(`[seed] Rol creado: ${r.nombre}`)
    }
  }

  // Tienda Central
  let central = await prisma.tienda.findFirst({ where: { nombre: 'Central' } })
  if (central) {
    console.log('[seed] Tienda "Central" ya existía, se omite creación')
  } else {
    central = await prisma.tienda.create({ data: { nombre: 'Central', ubicacion: 'Sede Central' } })
    console.log('[seed] Tienda "Central" creada')
  }

  // Tiendas adicionales de ejemplo
  const otras = [
    { nombre: 'Norte', ubicacion: 'Sucursal Norte' },
    { nombre: 'Sur', ubicacion: 'Sucursal Sur' },
  ]
  for (const t of otras) {
    const exists = await prisma.tienda.findFirst({ where: { nombre: t.nombre } })
    if (exists) {
      console.log(`[seed] Tienda "${t.nombre}" ya existía, se omite creación`)
    } else {
      await prisma.tienda.create({ data: t })
      console.log(`[seed] Tienda "${t.nombre}" creada`)
    }
  }

  // Admin
  const adminEmail = 'admin@techstore.com'
  let admin = await prisma.usuario.findUnique({ where: { email: adminEmail } })
  if (!admin) {
    const hash = await bcrypt.hash('Admin123!', 10)
    admin = await prisma.usuario.create({
      data: {
        email: adminEmail,
        password: hash,
        nombre_completo: 'Administrador TechStore',
        tienda_id: central.id,
        mfa_habilitado: false,
        activo: true,
      },
    })
    console.log(`[seed] Usuario admin creado: ${adminEmail}`)
  } else {
    console.log(`[seed] Usuario admin ya existía: ${adminEmail}`)
  }

  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'Admin' } })
  const link = await prisma.usuarioRol.findUnique({ where: { usuario_id_rol_id: { usuario_id: admin.id, rol_id: rolAdmin.id } } })
  if (link) {
    console.log('[seed] Rol Admin ya estaba asignado al usuario admin')
  } else {
    await prisma.usuarioRol.create({ data: { usuario_id: admin.id, rol_id: rolAdmin.id, asignado_por: admin.id } })
    console.log('[seed] Rol Admin asignado al usuario admin')
  }

  // Usuarios adicionales por rol
  const tiendas = await prisma.tienda.findMany()
  const tiendaMap = Object.fromEntries(tiendas.map(t => [t.nombre, t]))

  const userSeeds = [
    {
      email: 'gerente@techstore.com',
      password: 'Gerente123!',
      nombre_completo: 'Gerente Norte',
      tiendaNombre: 'Norte',
      rol: 'Gerente'
    },
    {
      email: 'empleado@techstore.com',
      password: 'Empleado123!',
      nombre_completo: 'Empleado Norte',
      tiendaNombre: 'Norte',
      rol: 'Empleado'
    },
    {
      email: 'auditor@techstore.com',
      password: 'Auditor123!',
      nombre_completo: 'Auditor Global',
      tiendaNombre: 'Central',
      rol: 'Auditor'
    }
  ]

  for (const seed of userSeeds) {
    let user = await prisma.usuario.findUnique({ where: { email: seed.email } })
    if (!user) {
      const hash = await bcrypt.hash(seed.password, 10)
      const tienda = tiendaMap[seed.tiendaNombre] || central
      user = await prisma.usuario.create({
        data: {
          email: seed.email,
          password: hash,
          nombre_completo: seed.nombre_completo,
          tienda_id: tienda?.id || central.id,
          mfa_habilitado: false,
          activo: true,
        }
      })
      console.log(`[seed] Usuario creado: ${seed.email}`)
    } else {
      console.log(`[seed] Usuario ya existía: ${seed.email}`)
    }

    const rol = await prisma.rol.findUnique({ where: { nombre: seed.rol } })
    if (!rol) {
      console.warn(`[seed] Rol no encontrado para ${seed.email}: ${seed.rol}`)
      continue
    }
    const hasRole = await prisma.usuarioRol.findUnique({ where: { usuario_id_rol_id: { usuario_id: user.id, rol_id: rol.id } } })
    if (hasRole) {
      console.log(`[seed] Usuario ${seed.email} ya tenía el rol ${seed.rol}`)
    } else {
      await prisma.usuarioRol.create({ data: { usuario_id: user.id, rol_id: rol.id, asignado_por: admin.id } })
      console.log(`[seed] Rol ${seed.rol} asignado a ${seed.email}`)
    }
  }

  // Producto ejemplo
  const existingProduct = await prisma.producto.findFirst({ where: { nombre: 'Laptop Pro 15', tienda_id: central.id } })
  if (existingProduct) {
    console.log('[seed] Producto de ejemplo ya existía, se omite creación')
  } else {
    await prisma.producto.create({
      data: {
        nombre: 'Laptop Pro 15',
        descripcion: 'Equipo de alto desempeño',
        precio: 1999.99,
        stock: 10,
        categoria: 'Computadoras',
        tienda_id: central.id,
        es_premium: true,
        creado_por: admin.id,
      },
    })
    console.log('[seed] Producto de ejemplo creado')
  }

  console.log('Seed Prisma completado')
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
