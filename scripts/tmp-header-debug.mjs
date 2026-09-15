import { chromium } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const path = process.argv[2] || '/stays';
const width = Number(process.argv[3] || 452);
const height = Number(process.argv[4] || 900);
const scrolls = (process.argv[5] || '0,40,100').split(',').map(Number);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
const theme = process.argv[6] || 'light';
if (theme !== 'light') {
  await page.addInitScript((t) => localStorage.setItem('kainchi-theme', t), theme);
}
await page.goto(BASE + path, { waitUntil: 'networkidle' });

for (const y of scrolls) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(600); // let scroll listener/rAF settle
  const data = await page.evaluate(() => {
    const header = document.querySelector('header.site-header');
    const form = document.querySelector('form');
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
    };
    return {
      scrollY: window.scrollY,
      headerClass: header?.className,
      header: rect(header),
      form: rect(form),
    };
  });
  console.log(`scroll=${y}`, JSON.stringify(data));
  await page.screenshot({ path: `tmp-header-${theme}-scroll-${y}.png` });
}
await browser.close();
