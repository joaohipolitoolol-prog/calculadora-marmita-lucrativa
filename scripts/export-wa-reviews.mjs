import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(__dirname, 'wa-reviews-export.html');

async function main() {
  await mkdir(path.join(root, 'public', 'paletas', 'reviews'), { recursive: true });
  await mkdir(path.join(root, 'public', 'postres', 'reviews'), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    deviceScaleFactor: 2,
    viewport: { width: 1400, height: 900 },
  });

  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });

  const phones = page.locator('.phone[data-out]');
  const count = await phones.count();
  for (let i = 0; i < count; i += 1) {
    const phone = phones.nth(i);
    const rel = await phone.getAttribute('data-out');
    const outPath = path.join(root, 'public', rel);
    await mkdir(path.dirname(outPath), { recursive: true });
    await phone.screenshot({ path: outPath, type: 'png' });
    console.log('wrote', rel);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
