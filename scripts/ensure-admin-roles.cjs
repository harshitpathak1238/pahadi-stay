const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  await db.$executeRawUnsafe("ALTER TABLE User MODIFY role ENUM('CUSTOMER','PARTNER','ADMIN','OWNER','STAFF') NOT NULL DEFAULT 'CUSTOMER'");
  await db.$executeRawUnsafe("UPDATE User SET role='OWNER' WHERE LOWER(email) IN ('harshitpathak1238@gmail.com','nilanshnegi1717@gmail.com')");
  console.log('Admin role schema updated.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
