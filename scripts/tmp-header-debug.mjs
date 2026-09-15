import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';

const t0 = Date.now();
const out = { steps: [] };
const writeResult = () => writeFileSync('tmp-acc-result.json', JSON.stringify(out, null, 2));
const deadline = setTimeout(() => { out.steps.push('deadline hit'); writeResult(); process.exit(0); }, 22000);

try {
  const browser = await chromium.launch();
  out.steps.push(`launched ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  const page = await browser.newPage({ viewport: { width: 452, height: 900 } });
  await page.goto('http://localhost:3000/stays/kainchidarshan-by-sanobar', { waitUntil: 'domcontentloaded', timeout: 12000 });
  out.steps.push(`loaded ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  const cards = page.locator('[data-acc-card]');
  await cards.first().waitFor({ timeout: 8000 });
  out.accCards = await cards.count();
  const card = cards.first();
  const badge = card.locator('span', { hasText: '/ night' }).first();
  out.badgeText = (await badge.textContent({ timeout: 4000 })).trim();
  out.badgeStyles = await badge.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, color: cs.color, pointerEvents: cs.pointerEvents };
  });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(5000);
  await card.screenshot({ path: 'tmp-acc-card.png' });
  out.screenshot = 'tmp-acc-card.png';
  await browser.close();
} catch (err) {
  out.error = String(err && err.message ? err.message : err);
}
clearTimeout(deadline);
out.elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
writeResult();
process.exit(0);

