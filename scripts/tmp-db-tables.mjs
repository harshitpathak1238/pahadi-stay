import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const rows = await db.$queryRawUnsafe(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'Prisma%'`);
console.log('prisma tables:', rows.map(r => r.TABLE_NAME));
const cols = await db.$queryRawUnsafe(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PrismaMigra'`);
console.log('PrismaMigra columns:', cols.map(c => c.COLUMN_NAME));
await db.$disconnect();
