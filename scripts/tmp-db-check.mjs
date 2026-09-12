import { readFileSync, writeFileSync } from 'fs';
let d = '';
try { d = readFileSync('.env.local', 'utf8'); } catch {}
if (!d) { try { d = readFileSync('.env', 'utf8'); } catch {} }
const m = d.match(/DATABASE_URL=(.+)/);
if (!m) { console.log('NO_URL'); process.exit(0); }
const u = m[1].trim();
writeFileSync('.tmp-db-url.txt', u);
console.log('OK URL_LEN=' + u.length);
// This project's Hostinger DB URL is the Prisma-compatible variant with
// scheme 'mysql://' replaced by 'mysql://' plus the connection params, but the
// actual runtime is MySQL. Determine scheme from the protocol segment.
const proto = u.split('://')[0] || '';
console.log('PROTO=' + proto);
console.log('DBNAME=' + (u.match(/\/([^?]+)\?/)||[])[1] || 'n/a');
