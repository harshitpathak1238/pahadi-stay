import { expect, test } from '@playwright/test';

test.describe('consumer smoke flow', () => {
  test('browse stays and block checkout without dates', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));

    await page.goto('/stays/oak-house-bhimtal', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Oak House by the Lake' })).toBeVisible();
    await expect(page.getByText('Select your dates to continue.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add stay to trip' })).toBeDisabled();
    expect(failedRequests).toEqual([]);
  });

  test('checkout displays an empty-trip state', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Your trip is empty.' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore stays' })).toHaveAttribute('href', '/stays');
  });
});
