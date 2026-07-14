/**
 * Captures REAL WebApp screens (Home desktop, Calculadora mobile, Mensajes mobile)
 * for the product mockup banner. Requires Vite running in demo mode (no Firebase).
 */
import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'scripts', 'mockup-captures');
const BASE = process.env.MOCKUP_BASE || 'http://localhost:5173';

const DEMO_USER = {
  name: 'Lucía',
  email: `mockup_${Date.now()}@demo.local`,
  password: 'mockup123',
};

async function dismissOverlays(page) {
  await page.evaluate(() => {
    localStorage.setItem('kit_onboarding_v2', '1');
    localStorage.setItem('app_theme_v1', 'light');
    sessionStorage.removeItem('paletas_post_purchase');
    document.documentElement.setAttribute('data-theme', 'light');
    document.getElementById('onboarding-root')?.remove();
    document.getElementById('welcome-banner')?.remove();
    document.body.classList.remove('onboarding-open');
    document.querySelectorAll('.toast').forEach((el) => {
      el.style.display = 'none';
    });
  });
  const skip = page.locator('#onboarding-skip');
  if (await skip.count()) {
    await skip.click({ timeout: 2000 }).catch(() => {});
  }
  const closeWelcome = page.locator('#welcome-banner-close');
  if (await closeWelcome.count()) {
    await closeWelcome.click({ timeout: 2000 }).catch(() => {});
  }
}

async function registerAndEnter(page) {
  await page.goto(`${BASE}/cadastrar?compra=1&paletas=1&src=hotmart`, {
    waitUntil: 'networkidle',
  });
  await page.evaluate(() => {
    localStorage.setItem('kit_onboarding_v2', '1');
    localStorage.setItem('app_theme_v1', 'light');
  });
  await page.waitForSelector('#register-form', { timeout: 15000 });
  await page.fill('#register-name', DEMO_USER.name);
  await page.fill('#register-email', DEMO_USER.email);
  await page.fill('#register-password', DEMO_USER.password);
  await Promise.all([
    page.waitForURL(/\/app/, { timeout: 20000 }),
    page.click('#register-form button[type="submit"]'),
  ]);
  await page.waitForSelector('.home-page, .home-hero, .app-shell', { timeout: 20000 });
  await dismissOverlays(page);
  await page.waitForTimeout(300);
}

async function fillCalculator(page) {
  await page.goto(`${BASE}/app?view=calc&line=paletas`, { waitUntil: 'networkidle' });
  await dismissOverlays(page);
  await page.waitForSelector('#calc-form', { timeout: 15000 });

  // Ensure simple mode (already active by default, only click if not active)
  const simpleBtn = page.locator('[data-mode="simple"]:not(.active)');
  if (await simpleBtn.count()) {
    await simpleBtn.click();
  }

  const fill = async (sel, value) => {
    const el = page.locator(sel);
    if (await el.count()) {
      await el.fill(String(value));
      await el.blur();
    }
  };

  await fill('#simple_sellingPrice', '2.50');
  await fill('#simple_foodCostPerUnit', '0.85');
  await fill('#simple_packaging', '0.15');
  await fill('#simple_gasPerUnit', '0.20');
  await fill('#simple_delivery', '0.30');
  await fill('#simple_wastePerUnit', '0.10');
  await fill('#simple_marmitasPerDay', '30');
  await fill('#simple_targetMarginPercent', '40');

  // Trigger live summary recalculation and scroll to top (summary + price fields)
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const summary = document.getElementById('live-summary');
    summary?.scrollIntoView({ block: 'start' });
    window.scrollTo(0, 0);
    document.querySelector('.app-content')?.scrollTo?.(0, 0);
  });
  await page.waitForTimeout(300);
}

async function captureHomeDesktop(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await registerAndEnter(page);
  await fillCalculator(page);
  // Submit / navigate so home reflects filled results
  const submit = page.locator('[data-view="results"], #calc-submit, button:has-text("Ver mi ganancia")');
  if (await submit.count()) {
    await submit.first().click();
    await page.waitForTimeout(600);
  }
  await page.goto(`${BASE}/app?view=home&line=paletas`, { waitUntil: 'networkidle' });
  await dismissOverlays(page);
  await page.waitForSelector('.home-hero', { timeout: 15000 });
  // Hide promotional overlays for a cleaner product shot (UI underneath stays real)
  await page.evaluate(() => {
    document.querySelectorAll(
      '.cross-sell-offer, .welcome-banner, .kit-pending-banner, .toast, [data-cross-sell]'
    ).forEach((el) => el.remove());
  });
  await page.waitForTimeout(400);

  // Prefer clipping the app shell (exclude browser chrome of the capture viewport)
  const shell = page.locator('.app-shell');
  const out = path.join(outDir, 'home-desktop.png');
  if (await shell.count()) {
    await shell.first().screenshot({ path: out, type: 'png' });
  } else {
    await page.screenshot({ path: out, type: 'png', fullPage: false });
  }
  await context.close();
  console.log('wrote', out);
  return out;
}

async function captureCalcMobile(browser) {
  const iPhone = devices['iPhone 14 Pro'];
  const context = await browser.newContext({
    ...iPhone,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  await registerAndEnter(page);
  await fillCalculator(page);
  await page.waitForSelector('#live-summary, .calc-form', { timeout: 15000 });
  await page.evaluate(() => {
    document.querySelector('.app-content')?.scrollTo?.(0, 0);
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);

  const out = path.join(outDir, 'calc-iphone.png');
  await page.screenshot({ path: out, type: 'png', fullPage: false });
  await context.close();
  console.log('wrote', out);
  return out;
}

async function captureMensajesMobile(browser) {
  const iPhone = devices['iPhone 14 Pro'];
  const context = await browser.newContext({
    ...iPhone,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  await registerAndEnter(page);

  // Open kit → vender → mensajes
  await page.goto(`${BASE}/app?view=kit&line=paletas`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Prefer hub vender / mensajes section
  const venderHub = page.locator('[data-kit-hub="vender"]');
  if (await venderHub.count()) {
    await venderHub.first().click();
    await page.waitForTimeout(400);
  }
  const mensajesTab = page.locator('[data-kit-section="mensajes"]');
  if (await mensajesTab.count()) {
    await mensajesTab.first().click();
    await page.waitForTimeout(400);
  }

  // Fallback deep navigation via home tile
  if (!(await page.locator('.kit-mensajes-page, .message-item, .mensajes-hint').count())) {
    await page.goto(`${BASE}/app?view=home&line=paletas`, { waitUntil: 'networkidle' });
    const venderTile = page.locator('.home-tile[data-kit-hub="vender"]');
    if (await venderTile.count()) {
      await venderTile.first().click();
      await page.waitForTimeout(500);
    }
    const mensajes = page.locator('[data-kit-section="mensajes"]');
    if (await mensajes.count()) await mensajes.first().click();
    await page.waitForTimeout(500);
  }

  await page.waitForSelector('.kit-mensajes-page, .message-item, .mensajes-hint, .section-card', {
    timeout: 20000,
  });
  await page.waitForTimeout(400);

  const out = path.join(outDir, 'mensajes-iphone.png');
  await page.screenshot({ path: out, type: 'png', fullPage: false });
  await context.close();
  console.log('wrote', out);
  return out;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    await captureHomeDesktop(browser);
    await captureCalcMobile(browser);
    await captureMensajesMobile(browser);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
