import { chromium } from 'playwright';
import fs from 'node:fs';

const widths = (process.env.CHECK_WIDTHS || '320,360,375,390,414').split(',').map((n) => Number(n.trim()));
const outDir = '.next/mobile-check';
fs.mkdirSync(outDir, { recursive: true });
const base = 'http://localhost:3000/stays/oak-house-bhimtal';

const browser = await chromium.launch();
const results = [];

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 780 } });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - window.innerWidth;
    const offenders = [];
    const seen = new Set();
    for (const el of document.querySelectorAll('*')) {
      if (seen.has(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > window.innerWidth + 1) {
        const cls = el.className && typeof el.className === 'string' ? el.className.slice(0, 100) : '';
        const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
        offenders.push({ tag: el.tagName, cls, right: Math.round(r.right * 10) / 10, txt });
        seen.add(el);
        if (offenders.length >= 6) break;
      }
    }
    const tabNav = document.querySelector('[aria-label="Stay page sections"]');
    const whats = document.querySelector('.whatsapp-drag');
    const trip = document.getElementById('trip-builder');
    const wr = whats ? whats.getBoundingClientRect() : null;
    return {
      innerWidth: window.innerWidth,
      scrollWidth: doc.scrollWidth,
      overflow,
      offenders,
      header: {
        hamburger: Boolean(document.querySelector('.mobile-menu summary')),
        theme: Boolean(document.querySelector('.theme-toggle')),
        signinPill: Boolean([...document.querySelectorAll('a')].some((a) => a.textContent.trim() === 'Sign in')),
      },
      tabs: tabNav ? {
        scrollable: tabNav.scrollWidth > tabNav.clientWidth + 4,
        scrollWidth: tabNav.scrollWidth,
        clientWidth: tabNav.clientWidth,
        fadePresent: Boolean(tabNav.parentElement && [...tabNav.parentElement.children].some((c) => c.className.includes && c.className.includes('bg-gradient-to-l'))),
        noScrollbar: tabNav.classList.contains('no-scrollbar'),
      } : null,
      whatsapp: wr ? {
        left: Math.round(wr.left), right: Math.round(wr.right), bottom: Math.round(wr.bottom),
        width: Math.round(wr.width), height: Math.round(wr.height),
      } : null,
      tripBuilder: trip ? {
        width: Math.round(trip.getBoundingClientRect().width),
        withinViewport: trip.getBoundingClientRect().right <= window.innerWidth + 1,
      } : null,
    };
  });

  // Hamburger: open, read links, close via Escape.
  const menu = { opened: false, links: [], closedByEscape: false };
  const summary = page.locator('.mobile-menu summary');
  if (await summary.count()) {
    await summary.click();
    await page.waitForTimeout(250);
    menu.opened = await page.evaluate(() => document.querySelector('.mobile-menu')?.hasAttribute('open') ?? false);
    menu.links = await page.evaluate(() => [...document.querySelectorAll('.mobile-menu nav a')].map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim() })));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    menu.closedByEscape = await page.evaluate(() => !(document.querySelector('.mobile-menu')?.hasAttribute('open')));
  }
  metrics.menu = menu;

  // WhatsApp: verify it hides on scroll-down and returns on scroll-up.
  const wa = await page.evaluate(async () => {
    const el = document.querySelector('.whatsapp-drag');
    if (!el) return null;
    const atRest = window.getComputedStyle(el).opacity;
    window.scrollTo(0, 600);
    await new Promise((resolve) => setTimeout(resolve, 350));
    const whileDown = window.getComputedStyle(el).opacity;
    const pe = getComputedStyle(el).pointerEvents;
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 350));
    const afterUp = window.getComputedStyle(el).opacity;
    return { atRest, whileDown, pointerEventsWhileDown: pe, afterUp };
  });
  metrics.whatsappScrollHide = wa;

  // Menu nav fits viewport when open.
  const menuNav = await page.evaluate(() => {
    const details = document.querySelector('.mobile-menu');
    const nav = document.querySelector('.mobile-menu nav');
    if (!details || !nav) return null;
    details.setAttribute('open', '');
    const r = nav.getBoundingClientRect();
    const fits = r.left >= -0.5 && r.right <= window.innerWidth + 0.5;
    details.removeAttribute('open');
    return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), fits };
  });
  metrics.menuNavFits = menuNav;

  // Tapping the last tab brings it fully into view inside the scrollable bar.
  const tabClick = await page.evaluate(async () => {
    const nav = document.querySelector('[aria-label="Stay page sections"]');
    const btn = document.getElementById('tab-reviews');
    if (!nav || !btn) return null;
    nav.scrollTo({ left: 0 });
    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 600));
    const r = btn.getBoundingClientRect();
    const nr = nav.getBoundingClientRect();
    return {
      btnLeft: Math.round(r.left), btnRight: Math.round(r.right),
      navLeft: Math.round(nr.left), navRight: Math.round(nr.right),
      fullyVisible: r.left >= nr.left - 1 && r.right <= nr.right + 1,
    };
  });
  metrics.tabClickVisibility = tabClick;

  // Header controls stay inside the viewport row.
  const headerFit = await page.evaluate(() => {
    const summary = document.querySelector('.mobile-menu summary');
    const header = document.querySelector('.site-header');
    const row = document.querySelector('.site-header > div');
    if (!summary || !header || !row) return null;
    const sr = summary.getBoundingClientRect();
    const hr = header.getBoundingClientRect();
    const rr = row.getBoundingClientRect();
    return {
      controlsRight: Math.round(sr.right), controlsBottom: Math.round(sr.bottom),
      headerBottom: Math.round(hr.bottom), rowRight: Math.round(rr.right),
      fitsViewport: sr.right <= window.innerWidth + 0.5,
      fitsHeaderHeight: sr.bottom <= hr.bottom + 0.5,
    };
  });
  metrics.headerFit = headerFit;

  // FAB geometry overlap at rest (visible regardless of opacity) over
  // headings/buttons/links at top, mid-facilities, and bottom scroll.
  // Fresh page load + instant scroll so a previous smooth scrollIntoView
  // animation can't skew the measured positions.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const fabOverlap = {};
  for (const [label, pos] of [['top', 0], ['mid', 900], ['bottom', 'max']]) {
    fabOverlap[label] = await page.evaluate((p) => {
      window.scrollTo({ top: p === 'max' ? document.body.scrollHeight : p, behavior: 'instant' });
      const fab = document.querySelector('.whatsapp-drag');
      if (!fab) return [];
      const fr = fab.getBoundingClientRect();
      const hits = [];
      for (const el of document.querySelectorAll('a, button, input, select, h1, h2, h3, li')) {
        if (el === fab) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden') continue;
        const ix = Math.max(0, Math.min(fr.right, r.right) - Math.max(fr.left, r.left));
        const iy = Math.max(0, Math.min(fr.bottom, r.bottom) - Math.max(fr.top, r.top));
        if (ix > 4 && iy > 4) {
          hits.push({ tag: el.tagName, txt: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 32), cls: (el.className || '').toString().slice(0, 50) });
        }
      }
      return hits.slice(0, 6);
    }, pos);
  }
  metrics.fabOverlap = fabOverlap;

  // Screenshot top, then scroll fully and screenshot bottom.
  await page.screenshot({ path: `${outDir}/${width}-top.png`, fullPage: false });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outDir}/${width}-bottom.png` });
  await page.close();

  results.push({ width, ...metrics });
}

console.log(JSON.stringify(results, null, 1));
fs.writeFileSync(`${outDir}/report.json`, JSON.stringify(results, null, 1));
await browser.close();