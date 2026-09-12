import { chromium } from 'playwright';

const width = Number(process.env.CHECK_W || '390');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 780 } });
await page.goto('http://localhost:3000/stays/oak-house-bhimtal', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const out = await page.evaluate(() => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  const fab = document.querySelector('.whatsapp-drag')?.getBoundingClientRect();
  const hero = document.querySelector('button.group.relative.h-\\[260px\\]')?.getBoundingClientRect();
  const heroEl = [...document.querySelectorAll('button')].find((b) => getComputedStyle(b).height === '260px')?.getBoundingClientRect();
  const about = [...document.querySelectorAll('h2')].find((h) => h.textContent === 'About this property')?.getBoundingClientRect();
  const h1 = document.querySelector('h1')?.getBoundingClientRect();
  const tabs = document.querySelector('[aria-label="Stay page sections"]')?.getBoundingClientRect();
  const titleBlock = [...document.querySelectorAll('div')].find((d) => d.className && d.className.toString().includes('sticky top-0'))?.getBoundingClientRect();
  const crumb = [...document.querySelectorAll('div')].find((d) => d.textContent.startsWith('Home') && d.textContent.includes('Stays') && d.children.length === 0)?.getBoundingClientRect();
  return {
    scrollY: window.scrollY,
    bodyH: document.body.scrollHeight,
    innerH: window.innerHeight,
    fab: fab && { t: Math.round(fab.top), b: Math.round(fab.bottom), l: Math.round(fab.left), r: Math.round(fab.right) },
    hero: (heroEl || hero) && { t: Math.round((heroEl || hero).top), b: Math.round((heroEl || hero).bottom) },
    about: about && { t: Math.round(about.top), b: Math.round(about.bottom) },
    h1: h1 && { t: Math.round(h1.top), b: Math.round(h1.bottom) },
    tabs: tabs && { t: Math.round(tabs.top) },
    titleBlock: titleBlock && { t: Math.round(titleBlock.top), h: Math.round(titleBlock.height) },
    crumb: crumb && { t: Math.round(crumb.top) },
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();