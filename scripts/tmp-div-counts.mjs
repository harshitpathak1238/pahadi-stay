import { readFileSync } from 'fs';
const s = readFileSync('components/public/StayDetailExperience.tsx', 'utf8');
const lines = s.split(String.fromCharCode(10));
let open = 0;
let close = 0;
let firstOpenLine = -1;
let lastOpenLine = -1;
let unmatchedCloses = [];
let openLines = [];
let closeLines = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const o = (l.match(/<div/g) || []);
  const c = (l.match(/<\/div>/g) || []);
  for (let j = 0; j < o.length; j++) {
    open++;
    openLines.push({ line: i + 1, idx: open, text: l.trim() });
    if (firstOpenLine < 0) firstOpenLine = i + 1;
    lastOpenLine = i + 1;
  }
  for (let j = 0; j < c.length; j++) {
    close++;
    closeLines.push({ line: i + 1, idx: close, text: l.trim() });
    if (close > open) unmatchedCloses.push(i + 1);
  }
}
console.log('open divs:', open, 'close divs:', close);
console.log('first open line:', firstOpenLine, 'last open line:', lastOpenLine);
console.log('unmatched closes (close>open):', unmatchedCloses);
if (open !== close) console.log('MISMATCH: open=', open, 'close=', close, 'diff=', open - close);
else console.log('div counts balanced');
console.log('--- open div lines (last 12) ---');
openLines.slice(-12).forEach(x => console.log(x.line + ' [' + x.idx + ']: ' + x.text));
console.log('--- close div lines (last 12) ---');
closeLines.slice(-12).forEach(x => console.log(x.line + ' [' + x.idx + ']: ' + x.text));
