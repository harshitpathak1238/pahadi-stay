import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const [row] = await db.$queryRawUnsafe(`SELECT \`id\`, \`houseRules\`, \`slug\` FROM \`Listing\` LIMIT 1`);
console.log('slug:', row.slug);
const parsed = typeof row.houseRules === 'string' ? JSON.parse(row.houseRules) : row.houseRules;
console.log('rules count:', Array.isArray(parsed) ? parsed.length : 'NOT_ARRAY');
if (Array.isArray(parsed)) {
  parsed.forEach((r, i) => console.log(`  [${i}]`, r.title, '::', r.text));
}
const def = await db.$queryRawUnsafe(`SELECT COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Listing' AND COLUMN_NAME = 'houseRules'`);
console.log('column default:', def[0].COLUMN_DEFAULT);
await db.$disconnect();
