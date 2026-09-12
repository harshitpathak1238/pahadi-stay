import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const raw = readFileSync('.tmp-db-url.txt', 'utf8').trim();
const url = raw.startsWith('"') ? raw.slice(1, -1) : raw;
console.log('using url (len=%d, proto=%s)', url.length, url.split('://')[0]);

const db = new PrismaClient({ log: ['error'] });

const sql = readFileSync('prisma/house-rules-backfill.sql', 'utf8');
console.log('sql length', sql.length);

const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
console.log('statement count:', statements.length);
for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  if (stmt.toUpperCase().startsWith('SELECT')) {
    try {
      const rows = await db.$queryRawUnsafe(stmt);
      console.log('SELECT #%d ->', i, JSON.stringify(rows).slice(0, 200));
    } catch (e) {
      console.log('SELECT #%d error (non-fatal):', i, e.message);
    }
    continue;
  }
  try {
    await db.$executeRawUnsafe(stmt);
    console.log('OK statement #%d (%d chars)', i, stmt.length);
  } catch (e) {
    // The ALTER TABLE ADD COLUMN is expected to error if the column already exists;
    // treat that as success (idempotent).
    const msg = e.message || '';
    if (stmt.toUpperCase().startsWith('ALTER') && (msg.includes('Duplicate column') || msg.includes('already exists') || msg.includes('1060') || msg.includes('1289'))) {
      console.log('OK statement #%d (column already exists — idempotent): %s', i, msg.slice(0, 80));
    } else {
      console.log('ERROR statement #%d: %s', i, msg.slice(0, 160));
    }
  }
}

const pre = await db.$queryRawUnsafe(`SELECT CAST(COUNT(*) AS SIGNED) AS n FROM \`Listing\``);
console.log('total listings:', Number(pre[0].n));
const sample = await db.$queryRawUnsafe(`SELECT id, \`houseRules\` FROM \`Listing\` LIMIT 3`);
for (const row of sample) {
  const raw = row.houseRules;
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  console.log('row', String(row.id).slice(0, 8), '-> rules', Array.isArray(parsed) ? parsed.length : typeof parsed);
}
await db.$disconnect();
console.log('done');
