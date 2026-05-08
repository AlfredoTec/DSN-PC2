/**
 * Cliente de Prisma instanciado y compartido en toda la app.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
