/**
 * Premium product mockup, REAL WebApp screens only.
 * Style: Apple / Stripe, devices first, soft atmosphere, no collage cards.
 */
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const captures = path.join(root, 'scripts', 'mockup-captures');
const outDir = path.join(root, 'public', 'paletas');

const WIDTH = 2400;
const HEIGHT = 1500;

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

async function dataUri(relOrAbs) {
  const abs = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(root, relOrAbs);
  const buf = await readFile(abs);
  return `data:${mimeFor(abs)};base64,${buf.toString('base64')}`;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const [home, calc, mensajes, fresa, mango, chocolate, limon] = await Promise.all([
    dataUri(path.join(captures, 'home-desktop.png')),
    dataUri(path.join(captures, 'calc-iphone.png')),
    dataUri(path.join(captures, 'mensajes-iphone.png')),
    dataUri('public/email/sabor-fresa.jpg'),
    dataUri('public/paletas/sabor-mango.webp'),
    dataUri('public/paletas/sabor-chocolate.webp'),
    dataUri('public/email/sabor-limon.jpg'),
  ]);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Mockup v2</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  .stage {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    background:
      radial-gradient(ellipse 90% 70% at 50% 0%, #FFE4EE 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 12% 70%, rgba(232,67,122,0.08), transparent 50%),
      radial-gradient(ellipse 55% 45% at 90% 65%, rgba(240,77,130,0.07), transparent 50%),
      linear-gradient(180deg, #FFF0F5 0%, #FFF8FA 42%, #FFFFFF 100%);
    overflow: hidden;
  }

  /* Soft out-of-focus paletas, no borders, no cards */
  .orb {
    position: absolute;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    filter: blur(1.5px);
    opacity: 0.55;
    z-index: 1;
    pointer-events: none;
  }
  .orb::after {
    content: '';
    position: absolute;
    inset: -20%;
    border-radius: 50%;
    background: radial-gradient(circle, transparent 35%, rgba(255,246,249,0.92) 72%);
  }
  .orb-1 { width: 340px; height: 340px; left: -40px; top: 180px; background-image: url('${fresa}'); transform: rotate(-8deg); }
  .orb-2 { width: 300px; height: 300px; right: -30px; top: 220px; background-image: url('${chocolate}'); transform: rotate(6deg); }
  .orb-3 { width: 280px; height: 280px; left: 80px; bottom: -40px; background-image: url('${mango}'); opacity: 0.4; filter: blur(3px); }
  .orb-4 { width: 260px; height: 260px; right: 90px; bottom: -20px; background-image: url('${limon}'); opacity: 0.38; filter: blur(3px); }

  .scene {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cluster {
    position: relative;
    width: 1680px;
    height: 980px;
  }

  /* ════════
     MacBook Pro, Space Gray, front-facing, photographic cues
     ════════════════════════════════════════════════════════ */
  .mb {
    position: absolute;
    left: 50%;
    top: 52%;
    width: 1120px;
    transform: translate(-50%, -50%);
    z-index: 2;
  }
  .mb-lid {
    position: relative;
    border-radius: 16px 16px 2px 2px;
    padding: 12px 12px 10px;
    background:
      linear-gradient(180deg, #7a7d82 0%, #5c5f64 18%, #4a4d52 55%, #3f4247 100%);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.28) inset,
      0 -1px 0 rgba(0,0,0,0.35) inset,
      0 0 0 1px rgba(0,0,0,0.25);
  }
  .mb-cam {
    position: absolute;
    top: 4px;
    left: 50%;
    width: 7px;
    height: 7px;
    margin-left: -3.5px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, #4a5568, #111 70%);
    box-shadow: 0 0 0 1.5px #2a2c30;
    z-index: 3;
  }
  .mb-screen {
    position: relative;
    border-radius: 4px;
    overflow: hidden;
    background: #0b0b0c;
    height: 680px;
    box-shadow: 0 0 0 1px #1a1a1c;
  }
  .mb-screen img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top left;
  }
  .mb-glass {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      125deg,
      rgba(255,255,255,0.07) 0%,
      transparent 28%,
      transparent 72%,
      rgba(255,255,255,0.03) 100%
    );
    pointer-events: none;
  }
  .mb-base {
    position: relative;
    height: 16px;
    margin: 0 -36px 0;
    border-radius: 0 0 12px 12px;
    background:
      linear-gradient(180deg, #9a9da2 0%, #6e7176 40%, #55585d 100%);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.4) inset,
      0 2px 0 #3a3d42,
      0 18px 40px rgba(61,34,40,0.18);
  }
  .mb-indent {
    position: absolute;
    left: 50%;
    top: 0;
    width: 140px;
    height: 6px;
    margin-left: -70px;
    border-radius: 0 0 5px 5px;
    background: linear-gradient(180deg, #4a4d52, #35383c);
  }
  .mb-floor {
    position: absolute;
    left: 6%;
    right: 6%;
    bottom: -36px;
    height: 40px;
    background: radial-gradient(ellipse at center, rgba(61,34,40,0.22), transparent 70%);
    filter: blur(8px);
    z-index: -1;
  }

  /* ════════
     iPhone 15 Pro, Space Black / Titanium
     ════════════════════════════════════════════════════════ */
  .ph {
    position: absolute;
    width: 292px;
    z-index: 4;
  }
  .ph-left {
    left: 36px;
    top: 120px;
    transform: rotate(-7.5deg) translateY(12px);
  }
  .ph-right {
    right: 36px;
    top: 140px;
    transform: rotate(7.5deg) translateY(12px);
  }
  .ph-body {
    position: relative;
    border-radius: 48px;
    padding: 11px;
    background:
      linear-gradient(145deg, #3a3a3c 0%, #1c1c1e 38%, #0d0d0e 100%);
    box-shadow:
      0 0 0 1.5px #4a4a4c,
      0 1px 0 rgba(255,255,255,0.22) inset,
      0 -2px 4px rgba(0,0,0,0.4) inset,
      0 32px 64px rgba(61,34,40,0.28),
      0 8px 20px rgba(61,34,40,0.16);
  }
  .ph-screen {
    position: relative;
    border-radius: 38px;
    overflow: hidden;
    background: #FFF6F9;
    height: 620px;
  }
  .ph-screen img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    /* push content below Dynamic Island */
    margin-top: 0;
  }
  .ph-island {
    position: absolute;
    top: 14px;
    left: 50%;
    width: 100px;
    height: 30px;
    margin-left: -50px;
    border-radius: 20px;
    background: #000;
    z-index: 5;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.04);
  }
  .ph-shine {
    position: absolute;
    inset: 0;
    border-radius: 38px;
    background: linear-gradient(
      155deg,
      rgba(255,255,255,0.14) 0%,
      transparent 26%,
      transparent 68%,
      rgba(255,255,255,0.04) 100%
    );
    pointer-events: none;
    z-index: 4;
  }
  .ph-btn {
    position: absolute;
    width: 3px;
    background: linear-gradient(180deg, #5a5a5c, #2a2a2c);
    border-radius: 2px;
  }
  .ph-left .btn-silent { left: -3px; top: 118px; height: 26px; }
  .ph-left .btn-vu { left: -3px; top: 168px; height: 50px; }
  .ph-left .btn-vd { left: -3px; top: 228px; height: 50px; }
  .ph-left .btn-pwr { right: -3px; top: 188px; height: 78px; }
  .ph-right .btn-silent { right: -3px; top: 118px; height: 26px; }
  .ph-right .btn-vu { right: -3px; top: 168px; height: 50px; }
  .ph-right .btn-vd { right: -3px; top: 228px; height: 50px; }
  .ph-right .btn-pwr { left: -3px; top: 188px; height: 78px; }
</style>
</head>
<body>
  <div class="stage" id="banner">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    <div class="orb orb-4"></div>

    <div class="scene">
      <div class="cluster">
        <div class="ph ph-left">
          <div class="ph-btn btn-silent"></div>
          <div class="ph-btn btn-vu"></div>
          <div class="ph-btn btn-vd"></div>
          <div class="ph-btn btn-pwr"></div>
          <div class="ph-body">
            <div class="ph-screen">
              <img src="${calc}" alt="">
              <div class="ph-island"></div>
              <div class="ph-shine"></div>
            </div>
          </div>
        </div>

        <div class="mb">
          <div class="mb-lid">
            <div class="mb-cam"></div>
            <div class="mb-screen">
              <img src="${home}" alt="">
              <div class="mb-glass"></div>
            </div>
          </div>
          <div class="mb-base"><div class="mb-indent"></div></div>
          <div class="mb-floor"></div>
        </div>

        <div class="ph ph-right">
          <div class="ph-btn btn-silent"></div>
          <div class="ph-btn btn-vu"></div>
          <div class="ph-btn btn-vd"></div>
          <div class="ph-btn btn-pwr"></div>
          <div class="ph-body">
            <div class="ph-screen">
              <img src="${mensajes}" alt="">
              <div class="ph-island"></div>
              <div class="ph-shine"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const htmlPath = path.join(captures, 'product-mockup-banner.html');
  await writeFile(htmlPath, html, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const pngPath = path.join(outDir, 'mockup-webapp-devices.png');
  const webpPath = path.join(outDir, 'mockup-webapp-devices.webp');
  await page.locator('#banner').screenshot({ path: pngPath, type: 'png' });
  await browser.close();

  const sharp = (await import('sharp')).default;
  await sharp(pngPath).webp({ quality: 92 }).toFile(webpPath);

  console.log('wrote', pngPath);
  console.log('wrote', webpPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
