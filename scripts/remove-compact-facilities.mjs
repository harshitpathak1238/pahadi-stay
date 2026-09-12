import { readFileSync, writeFileSync } from 'fs';
const path = 'components/public/StayDetailExperience.tsx';
let text = readFileSync(path, 'utf8');

// The stray block (injected after `import`), 7 lines total, terminated by the blank line
// right before `  const faqs = (stay.faqs ?? []).filter(...)`.
const startMarker = '// Compact facilities UI: show the first N items inline; the rest hide behind "View more".';
const endMarker = '  const faqs = (stay.faqs ?? []).filter((faq) => faq.question.trim() && faq.answer.trim());';

const startIdx = text.indexOf(startMarker);
if (startIdx < 0) { console.log('start marker not found'); process.exit(0); }
const endIdx = text.indexOf(endMarker, startIdx);
if (endIdx < 0) { console.log('end marker not found'); process.exit(1); }

const before = text.slice(0, startIdx);
const after = text.slice(endIdx); // includes the endMarker line
const removed = text.slice(startIdx, endIdx);
writeFileSync(path, before + after);
console.log('removed', removed.split('\n').length, 'lines');
console.log(removed);
