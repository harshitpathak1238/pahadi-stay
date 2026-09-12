import { readFileSync } from 'fs';
const h = readFileSync('components/public/StayBottomBar.tsx', 'utf8');
console.log('has title prop:', h.includes('title:'));
console.log('props line:', h.match(/export function.*?\)\s*:/s)?.[0]?.slice(0, 120));
