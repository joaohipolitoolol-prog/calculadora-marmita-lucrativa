/**
 * Export Postres kit HTML → PDF via Playwright (same approach as Paletas build.py).
 * Run after generate-postres-kit.mjs (or use npm run pdfs:postres).
 */
import { mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const JOBS = [
  ['public/postres/produto/Kit_Postres_en_Vaso.html', 'public/postres/produto/Kit_Postres_en_Vaso.pdf'],
  ['public/postres/produto/Mensajes_Postres.html', 'public/postres/produto/Mensajes_Postres.pdf'],
  ['public/postres/produto/Plan_7_Dias_Postres.html', 'public/postres/produto/Plan_7_Dias_Postres.pdf'],
  ['public/postres/produto/Checklist_Postres.html', 'public/postres/produto/Checklist_Postres.pdf'],
  ['public/postres-premium/produto/Kit_Premium_Postres.html', 'public/postres-premium/produto/Kit_Premium_Postres.pdf'],
];

async function htmlToPdf(browser, htmlRel, pdfRel) {
  const htmlPath = path.join(root, htmlRel);
  const pdfPath = path.join(root, pdfRel);
  if (!existsSync(htmlPath)) {
    throw new Error(`Missing HTML: ${htmlRel}`);
  }
  mkdirSync(path.dirname(pdfPath), { recursive: true });

  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle', timeout: 120_000 });
  // Allow Google Fonts to settle if online; ignore if offline (system fallback)
  await new Promise((r) => setTimeout(r, 800));
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await page.close();
  return pdfRel;
}

async function main() {
  console.log('Exporting Postres PDFs…');
  const browser = await chromium.launch();
  try {
    for (const [html, pdf] of JOBS) {
      const out = await htmlToPdf(browser, html, pdf);
      console.log(`  OK ${out}`);
    }
  } finally {
    await browser.close();
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
