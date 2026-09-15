// Temp verification script for the WhatsApp enquiry UI changes.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();

  // --- Mobile: bottom bar + modal ---
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  await page.goto('http://localhost:3000/stays/kainchidarshan-by-sanobar', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const barCheck = await page.evaluate(() => {
    const barEl = document.querySelector('div.fixed.bottom-0 > div');
    if (!barEl) return null;
    const r = barEl.getBoundingClientRect();
    const kids = [...barEl.children].map((c) => ({ w: Math.round(c.getBoundingClientRect().width), text: (c.textContent || '').trim().slice(0, 30) }));
    return { width: Math.round(r.width), scrollWidth: barEl.scrollWidth, clientWidth: barEl.clientWidth, overflows: barEl.scrollWidth > barEl.clientWidth + 1, kids };
  });
  console.log('BOTTOM BAR @360:', JSON.stringify(barCheck));
  await page.screenshot({ path: 'tmp-after-bar.png' });

  // Open the enquiry modal via the labeled WhatsApp button
  await page.getByRole('button', { name: 'WhatsApp inquiry' }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'tmp-after-modal.png' });

  // Select the first two bedrooms and screenshot the bright green state
  const cards = page.locator('[role="checkbox"][aria-label^="Select "]');
  console.log('BEDROOM CARDS:', await cards.count());
  await cards.nth(0).click();
  await cards.nth(1).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'tmp-after-selected.png' });

  const ctaText = await page.locator('div[role="dialog"] button:has-text("WhatsApp inquiry")').last().textContent();
  console.log('MODAL CTA TEXT:', JSON.stringify(ctaText));

  // --- Desktop modal ---
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desktop.goto('http://localhost:3000/stays/kainchidarshan-by-sanobar', { waitUntil: 'networkidle' });
  await desktop.getByRole('button', { name: /Enquire on WhatsApp/i }).first().click();
  await desktop.waitForTimeout(700);
  await desktop.screenshot({ path: 'tmp-after-modal-desktop.png' });

  await browser.close();
  console.log('DONE');
})();
