import { readFileSync } from 'fs';
const s = readFileSync('components/public/StayDetailExperience.tsx', 'utf8');
const lines = s.split(String.fromCharCode(10));
const keys = ['<main', '</main>', '<article', '</article>', '<aside', '</aside>', 'export function', 'return (', '});', 'classNames=', 'stay.houseRules', 'showAllFac', 'stays.', '.png'];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l == null) continue;
  for (let k = 0; k < keys.length; k++) {
    if (l.indexOf(keys[k]) >= 0) {
      console.log((i + 1) + ': ' + l);
      break;
    }
  }
}
console.log('TOTAL LINES:', lines.length);
