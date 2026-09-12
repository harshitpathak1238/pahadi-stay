import { chromium } from 'playwright';
import fs from 'node:fs';

const widths = (process.env.CHECK_WIDTHS || '375,320,1280').split(',').map((n) => Number(n.trim()));
const base = 'http://localhost:3000/stays/oak-house-bhimtal';
const outDir = '.next/bottombar-check';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const results = [];

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 780 } });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900); // bar fades in after ~220ms

  const metrics = await page.evaluate(() => {
    const bar = [...document.querySelectorAll('div')].find(
      (d) => typeof d.className === 'string' && d.className.includes('fixed') && d.className.includes('bottom-0') && d.textContent.includes('Add to your trip')
    );
    const cs = bar ? getComputedStyle(bar) : null;
    const br = bar ? bar.getBoundingClientRect() : null;
    const btn = bar ? [...bar.querySelectorAll('button')].find((b) => b.textContent.includes('Add to your trip')) : null;
    const btnCs = btn ? getComputedStyle(btn) : null;
    const btnR = btn ? btn.getBoundingClientRect() : null;
    const fab = document.querySelector('.whatsapp-drag');
    const fabR = fab ? fab.getBoundingClientRect() : null;
    const trip = document.getElementById('trip-builder');
    const overlap = (a, b) => a && b ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) : 0;
    return {
      barMounted: Boolean(bar),
      bar: br && cs ? {
        position: cs.position, display: cs.display, zIndex: cs.zIndex,
        opacity: cs.opacity, transform: cs.transform,
        top: Math.round(br.top), bottom: Math.round(br.bottom),
        left: Math.round(br.left), right: Math.round(br.right), height: Math.round(br.height),
        pinnedToViewportBottom: Math.abs(br.bottom - window.innerHeight) <= 1,
        fullBleed: br.left <= 0 && br.right >= window.innerWidth - 1,
      } : null,
      price: bar ? (bar.textContent.match(/From[\s\S]*?₹[\d,.]+\s*\/\s*night/i) || [''])[0].replace(/\s+/g, ' ').trim() : null,
      hasTaxesNote: bar ? bar.textContent.includes('Includes taxes') : false,
      button: btn && btnCs && btnR ? {
        text: btn.textContent.trim(),
        bg: btnCs.backgroundColor,
        pointerEvents: btnCs.pointerEvents,
        withinViewport: btnR.right <= window.innerWidth + 1 && btnR.left >= -1,
        height: Math.round(btnR.height),
      } : null,
      fab: fab && fabR ? {
        zIndex: getComputedStyle(fab).zIndex, opacity: getComputedStyle(fab).opacity,
        bottom: Math.round(fabR.bottom), right: Math.round(fabR.right),
        overlapPxWithBar: Math.round(overlap(fabR, br)),
        overlapPxWithButton: Math.round(overlap(fabR, btnR)),
        sitsAboveBar: Number(getComputedStyle(fab).zIndex) > Number(cs ? cs.zIndex : 0),
      } : null,
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

  if (width < 800) {
    await page.screenshot({ path: `${outDir}/${width}-bar.png` });
    if (metrics.barMounted) {
      // Click the bar button → #trip-builder should land near viewport center.
      await page.evaluate(() => {
        const bar = [...document.querySelectorAll('div')].find(
          (d) => typeof d.className === 'string' && d.className.includes('fixed') && d.className.includes('bottom-0') && d.textContent.includes('Add to your trip')
        );
        [...bar.querySelectorAll('button')].find((b) => b.textContent.includes('Add to your trip')).click();
      });
      await page.waitForTimeout(900);
      metrics.afterClick = await page.evaluate(() => {
        const trip = document.getElementById('trip-builder');
        if (!trip) return null;
        const r = trip.getBoundingClientRect();
        const centerOffset = Math.round(r.top + r.height / 2 - window.innerHeight / 2);
        return { tripTop: Math.round(r.top), centerOffset, nearCenter: Math.abs(centerOffset) < Math.max(120, r.height / 2) };
      });
      await page.screenshot({ path: `${outDir}/${width}-after-click.png` });
    } else {
      metrics.afterClick = 'SKIPPED — bar not mounted';
    }
  }

  await page.close();
  results.push({ width, ...metrics });
}

console.log(JSON.stringify(results, null, 1));
fs.writeFileSync(`${outDir}/report.json`, JSON.stringify(results, null, 1));
await browser.close();
