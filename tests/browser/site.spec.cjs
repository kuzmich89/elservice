const {test, expect} = require('@playwright/test');
// No real emails or third-party requests are allowed in automated checks.
test.beforeEach(async ({page}) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});
for (const [prefix, lang] of [['/', 'uk'], ['/en/', 'en']]) {
  test(`${lang}: layout, keyboard menu, language switch and navigation`, async ({page}) => {
    const external = [], errors = [];
    page.on('request', r => {if (new URL(r.url()).hostname !== '127.0.0.1') external.push(r.url());});
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(prefix);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('heading', {level: 1})).toBeVisible();
    await expect(page.locator('.hero-intro')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page).toHaveScreenshot(`${lang}-home.png`, {animations: 'disabled', maxDiffPixelRatio: 0.01});
    const toggle = page.locator('#menu-toggle');
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('.menu-close')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(page.locator('#site-navigation a').last()).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toBeFocused();
    }
    await page.locator('.language-switch').click();
    await expect(page.locator('html')).toHaveAttribute('lang', lang === 'uk' ? 'en' : 'uk');
    for (const route of ['about', 'products', 'services', 'projects', 'privacy']) {
      const response = await page.goto(prefix + route);
      expect(response.status()).toBe(200);
      await expect(page.getByRole('heading', {level: 1})).toBeVisible();
    }
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  });
  test(`${lang}: failed delivery, duplicate protection, retry and success`, async ({page}) => {
    let requests = 0;
    await page.route('https://formsubmit.co/**', async route => {
      requests++;
      const data = new URLSearchParams(route.request().postData());
      expect(data.get('Name')).toBe('Test User');
      expect(data.get('consent')).toBeNull();
      await new Promise(resolve => setTimeout(resolve, 350));
      await route.fulfill({status: requests === 1 ? 503 : 200, json: requests === 1 ? {} : {success: 'true'}});
    });
    await page.goto(prefix);
    const form = page.locator('[data-contact-form]');
    await form.locator('[name="Name"]').fill('Test User');
    await form.locator('[name="Phone"]').fill('+380 (50) 123-45-67');
    await form.locator('[name="consent"]').check();
    const submit = form.locator('[type="submit"]');
    await submit.click();
    await expect(submit).toBeDisabled();
    await form.evaluate(f => f.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true})));
    await expect(form.locator('.form-status')).toHaveAttribute('data-state', 'error');
    await expect(form.locator('.form-status')).toContainText('office@elservis.com.ua');
    await expect(form.locator('[name="Name"]')).toHaveValue('Test User');
    expect(requests).toBe(1);
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(form.locator('.form-status')).toHaveAttribute('data-state', 'success');
    await expect(form.locator('[name="Name"]')).toHaveValue('');
    expect(requests).toBe(2);
  });
}
test('required fields, phone validation and consent prevent invalid requests', async ({page}) => {
  let requests = 0;
  await page.route('https://formsubmit.co/**', route => {requests++; return route.abort();});
  await page.goto('/');
  const form = page.locator('[data-contact-form]');
  await form.locator('[type="submit"]').click();
  await expect(form.locator('[name="Name"]')).toBeFocused();
  await form.locator('[name="Name"]').fill('Test');
  await form.locator('[name="Phone"]').fill('0000000000');
  await form.locator('[name="consent"]').check();
  await form.locator('[type="submit"]').click();
  expect(await form.locator('[name="Phone"]').evaluate(el => el.validity.valid)).toBe(false);
  await form.locator('[name="Phone"]').fill('0501234567');
  await form.locator('[name="consent"]').uncheck();
  await form.locator('[type="submit"]').click();
  await expect(form.locator('[name="consent"]')).toBeFocused();
  expect(requests).toBe(0);
});
test('catalogue filters preserve all 17 products and expose technical details', async ({page}) => {
  await page.goto('/products');
  await expect(page.locator('.product-card')).toHaveCount(17);
  const filters = page.locator('[data-filter]:not([data-filter="all"])');
  for (const button of await filters.all()) {
    await button.click();
    const category = await button.getAttribute('data-filter');
    const cards = page.locator('.product-card:visible');
    expect(await cards.count()).toBeGreaterThan(0);
    expect(await cards.evaluateAll(cards => cards.map(c => c.dataset.category))).toEqual(Array(await cards.count()).fill(category));
  }
  await page.locator('[data-filter="all"]').click();
  await expect(page.locator('.product-card:visible')).toHaveCount(17);
  const first = page.locator('.product-card').first();
  await first.locator('summary').click();
  await expect(first.locator('details')).toHaveAttribute('open', '');
  await expect(first.locator('details p')).not.toBeEmpty();
});
test('project gallery uses a native dialog and restores keyboard focus', async ({page}) => {
  await page.goto('/projects');
  const opener = page.locator('.gallery-trigger').first();
  await opener.click();
  await expect(page.locator('#photo-dialog')).toBeVisible();
  await expect(page.locator('#photo-count')).toHaveText('1 / 8');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#photo-count')).toHaveText('2 / 8');
  await page.keyboard.press('Escape');
  await expect(page.locator('#photo-dialog')).not.toBeVisible();
  await expect(opener).toBeFocused();
});
test('reduced motion, accessibility and custom 404', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const route of ['/', '/products', '/projects', '/privacy']) {
    await page.goto(route);
    await page.addScriptTag({path: require.resolve('axe-core')});
    const violations = await page.evaluate(async () => (await axe.run(document, {
      runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa']}
    })).violations.map(v => ({id: v.id, targets: v.nodes.map(n => n.target)})));
    expect(violations, route).toEqual([]);
  }
  const response = await page.goto('/missing-page-for-test');
  expect(response.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Сторінку не знайдено');
  await expect(page).toHaveScreenshot('404.png', {animations: 'disabled'});
});
test('a stalled submission times out and allows another attempt', async ({page}) => {
  await page.route('https://formsubmit.co/**', () => {});
  await page.goto('/');
  const form = page.locator('[data-contact-form]');
  await form.locator('[name="Name"]').fill('Timeout Test');
  await form.locator('[name="Phone"]').fill('0501234567');
  await form.locator('[name="consent"]').check();
  await page.clock.install();
  await form.locator('[type="submit"]').click();
  await expect(form).toHaveAttribute('aria-busy', 'true');
  await page.clock.fastForward(15001);
  await expect(form.locator('.form-status')).toHaveAttribute('data-state', 'error');
  await expect(form.locator('[type="submit"]')).toBeEnabled();
});
