import { readFileSync, writeFileSync } from 'fs';
const f = 'components/admin/CategoryListingEditor.tsx';
let content = readFileSync(f, 'utf8');

// Fix onMove direction param type annotation
content = content.replace(/onMove=\{(direction) => setForm/, 'onMove={(direction: -1 | 1) => setForm');

writeFileSync(f, content);
console.log('onMove with type now:', content.includes('onMove={(direction: -1 | 1) => setForm'));










