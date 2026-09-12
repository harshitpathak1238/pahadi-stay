import { readFileSync } from 'fs';
const s = readFileSync('components/public/StayDetailExperience.tsx', 'utf8');
const lines = s.split(String.fromCharCode(10));
// trace full stack from return (line 135) to end (line 552)
let stack = [];
let openTotal = 0, closeTotal = 0;
const events = [];
for (let i = 134; i < lines.length; i++) {
  const l = lines[i];
  const os = l.match(/<div/g);
  const cs = l.match(/<\/div>/g);
  if (os) { for (let j = 0; j < os.length; j++) { openTotal++; stack.push({ kind: 'open', line: i+1, idx: openTotal, text: l.trim() }); events.push({ line: i+1, open: openTotal, close: null, text: l.trim() }); } }
  if (cs) { for (let j = 0; j < cs.length; j++) { closeTotal++; const o = stack.pop(); events.push({ line: i+1, open: o?o.idx:null, close: closeTotal, text: l.trim() }); } }
}
console.log('openTotal:', openTotal, 'closeTotal:', closeTotal, 'stack remaining (unclosed):', stack.length);
console.log('--- unclosed divs (stack remaining) ---');
stack.forEach(x => console.log('unclosed OPEN #' + x.idx + ' @' + x.line + ': ' + x.text));
console.log('--- all close events (first 5 + last 8) ---');
events.filter(e => e.close !== null).slice(0,5).forEach(e => console.log('CLOSE #' + e.close + ' closes OPEN #' + e.open + ' @' + e.line + ': ' + e.text));
console.log('...');
events.filter(e => e.close !== null).slice(-8).forEach(e => console.log('CLOSE #' + e.close + ' closes OPEN #' + e.open + ' @' + e.line + ': ' + e.text));
