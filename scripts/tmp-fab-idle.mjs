import { chromium } from 'playwright';

// Idle-hide check: at rest over content the FAB must fade out after ~4s so
// nothing stays unreadable/unclickable behind it.
const width = Number(process.env.CHECK_W || '390');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 780 } });
await page.goto('http://localhost:3000/stays/oak-house-bhimtal', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const result = await page.evaluate(async () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  const fab = () => document.querySelector('.whatsapp-drag');
  const snapshot = () => {
    const el = fab();
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { opacity: cs.opacity, pointerEvents: cs.pointerEvents, top: Math.round(r.top), bottom: Math.round(r.bottom) };
  };
  const immediate = snapshot();
  await new Promise((r) => setTimeout(r, 4800));
  return { immediate, afterIdle: snapshot() };
});
console.log(JSON.stringify(result, null, 1));
await browser.close();