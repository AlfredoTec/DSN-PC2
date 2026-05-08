// Prisma 7: Configuración centralizada (CLI)
// - datasource.url para Migrate/CLI (se toma de env)
// - migrations.seed para "prisma db seed" (usa Node y nuestro prisma/seed.js)

const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL

export default {
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: 'node ./prisma/seed.js',
  },
}
