import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 780 } });
await page.goto('http://localhost:3000/stays/oak-house-bhimtal', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);

const out = await page.evaluate(() => {
  const trip = document.getElementById('trip-builder');
  let category = null, hasFiber = false;
  if (trip) {
    const key = Object.keys(trip).find((k) => k.startsWith('__reactFiber$'));
    hasFiber = Boolean(key);
    if (key) {
      let fiber = trip[key];
      while (fiber && !(fiber.memoizedProps && fiber.memoizedProps.stay)) fiber = fiber.return;
      const stay = fiber?.memoizedProps?.stay;
      category = stay ? stay.category : null;
    }
  }
  const fixedBottoms = [...document.querySelectorAll('div')]
    .filter((d) => typeof d.className === 'string' && d.className.includes('fixed') && d.className.includes('bottom-0'))
    .map((d) => d.className.slice(0, 90));
  return {
    innerWidth: window.innerWidth,
    category,
    hasFiber,
    tripBuilderInDom: Boolean(trip),
    fixedBottoms,
    anyAddToTripText: [...document.querySelectorAll('strong, button, span')].some((el) => el.textContent.trim() === 'Add to your trip'),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
