# -*- coding: utf-8 -*-
"""Genera archivos del complemento Paletas Premium."""
from pathlib import Path

from content_premium import (
    RECETAS_PREMIUM,
    COMBOS_RENTABLES,
    FECHAS_ESPECIALES,
    GUIA_PRESENTACION,
    MENSAJES_PREMIUM,
    ALERGENOS_PREMIUM,
)

ROOT = Path(__file__).resolve().parent.parent
PRODUTO = ROOT / "produto"
BUILD = Path(__file__).resolve().parent
STYLES = (BUILD.parent.parent / "paletas-de-whatsapp" / "build" / "styles.css").read_text(encoding="utf-8")


def tipo_badge(tipo):
    m = {"Frutal": "badge-frutal", "Cremosa": "badge-cremosa", "Rellena": "badge-rellena", "Estilo postre": "badge-postre"}
    return m.get(tipo, "badge-cremosa")


def receta_html(r):
    ing = "".join(f"<li>{i}</li>" for i in r["ingredientes"])
    pasos = "".join(f"<li>{p}</li>" for p in r["pasos"])
    dif = "badge-facil" if r["dificultad"] == "Fácil" else "badge-media"
    alergia = ALERGENOS_PREMIUM.get(r["num"])
    alergia_html = f'<p class="alergeno-tag"><strong>Contiene:</strong> {alergia}</p>' if alergia else ""
    return f"""
    <div class="receta-card">
      <div class="receta-header">
        <div class="receta-num">{r['num']}</div>
        <div class="receta-title"><h3>{r['nombre']}</h3></div>
      </div>
      <div class="receta-meta">
        <span class="badge {tipo_badge(r['tipo'])}">{r['tipo']}</span>
        <span class="badge {dif}">{r['dificultad']}</span>
      </div>
      <p><strong>Preparación:</strong> {r['prep']} &nbsp;|&nbsp; <strong>Congelación:</strong> {r['congelacion']} &nbsp;|&nbsp; <strong>Rinde:</strong> {r['rendimiento']}</p>
      {alergia_html}
      <div class="receta-grid">
        <div class="ingredientes"><h4>Ingredientes</h4><ul>{ing}</ul></div>
        <div><h4>Preparación</h4><ol>{pasos}</ol></div>
        <div class="col-full dica-vender"><strong>💡 Consejo para vender:</strong> {r['consejo']}</div>
      </div>
    </div>"""


def page_header():
    return '<div class="page-header"><strong>Paletas Premium</strong><span>Complemento digital</span></div>'


def paginate_blocks(blocks, per_page, first_header="", page_header_fn=page_header):
    pages = []
    for i in range(0, len(blocks), per_page):
        batch = "".join(blocks[i:i + per_page])
        header = first_header if i == 0 else page_header_fn()
        pages.append(f'<div class="page screen-compact">{header}{batch}</div>')
    return "".join(pages)


THEME_TOGGLE_HTML = """<button type="button" class="theme-float" id="themeToggle" aria-label="Cambiar tema">
  <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
  <svg class="icon-moon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/></svg>
</button>"""

THEME_SCRIPT = """(function() {
  const KEY = 'paletas-kit-theme';
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem(KEY);
  if (saved === 'dark') root.setAttribute('data-theme', 'dark');
  if (btn) btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem(KEY, next);
  });
})();"""


def menu_row(sabor="", precio="", sabor_ph="Otro sabor"):
    return (
        f'<div class="menu-linea menu-linea-input">'
        f'<input class="sabor" type="text" placeholder="{sabor_ph}" value="{sabor}">'
        f'<span class="menu-dots" aria-hidden="true"></span>'
        f'<input class="precio" type="text" placeholder="0.00" inputmode="decimal" value="{precio}">'
        f'</div>'
    )


def html_shell(title, body, interactive=False):
    theme = THEME_TOGGLE_HTML if interactive else ""
    script = f"<script>{THEME_SCRIPT}</script>" if interactive else ""
    return f"""<!DOCTYPE html>
<html lang="es" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>{STYLES}</style>
</head>
<body>
{theme}
<div class="document">
{body}
</div>
{script}
</body>
</html>"""


def build_kit_html():
    cards = [receta_html(r) for r in RECETAS_PREMIUM]
    recipe_pages = paginate_blocks(
        cards,
        2,
        '<span class="section-tag">Recetas</span><h2>20 recetas premium</h2>',
    )
    return html_shell(
        "Kit Premium Paletas",
        f"""<div class="page cover cover-page screen-compact">
  <div class="cover-icon">✨</div>
  <h1>Paletas Premium y Combos Rentables</h1>
  <p class="subtitle">20 recetas premium · Complemento del Kit Paletas para WhatsApp</p>
</div>
<div class="page screen-compact">
  {page_header()}
  <span class="section-tag">Introducción</span>
  <h2>Cómo usar este complemento</h2>
  <p>Este material amplía tu menú con recetas de mayor valor percibido, ideas de combos y recursos de presentación. Úsalo junto con la calculadora del kit principal para fijar precios.</p>
  <ol>
    <li>Elige 3 a 5 recetas premium para tu próxima tanda</li>
    <li>Agrega 1 o 2 combos al menú editable</li>
    <li>Usa los mensajes listos para anunciar en WhatsApp</li>
    <li>Adapta fechas especiales a tu calendario local</li>
  </ol>
</div>
{recipe_pages}""",
    )


def build_combos_html():
    items = []
    for c in COMBOS_RENTABLES:
        items.append(f"""<div class="dia-card">
          <h3>{c['nombre']}</h3>
          <p><strong>Contenido:</strong> {c['contenido']}</p>
          <p><strong>Precio sugerido:</strong> {c['precio_guia']}</p>
          <p><strong>Público:</strong> {c['publico']}</p>
          <p class="dica-vender"><strong>Mensaje:</strong> {c['mensaje']}</p>
        </div>""")
    pages = paginate_blocks(
        items,
        3,
        '<span class="section-tag">Combos</span><h2>10 ideas de combos rentables</h2><p>Los precios son guías. Ajusta con tu calculadora según costos locales.</p>',
    )
    return html_shell("Combos Rentables", pages)


def build_fechas_html():
    items = []
    for f in FECHAS_ESPECIALES:
        ideas = "".join(f"<li>{i}</li>" for i in f["ideas"])
        items.append(f"""<div class="dia-card">
          <h3>{f['fecha']}</h3>
          <ul>{ideas}</ul>
          <p class="dica-vender"><strong>Promo:</strong> {f['promo']}</p>
        </div>""")
    pages = paginate_blocks(
        items,
        3,
        '<span class="section-tag">Calendario</span><h2>Ideas para fechas especiales</h2>',
    )
    return html_shell("Fechas Especiales", pages)


def build_guia_html():
    sections = []
    for titulo, tips in [
        ("Fotos que venden", GUIA_PRESENTACION["fotos"]),
        ("Nombres en el menú", GUIA_PRESENTACION["nombres"]),
        ("Empaque", GUIA_PRESENTACION["empaque"]),
        ("Precios premium", GUIA_PRESENTACION["precios"]),
    ]:
        lis = "".join(f"<li>{t}</li>" for t in tips)
        sections.append(f"<h3>{titulo}</h3><ul>{lis}</ul>")
    pages = paginate_blocks(
        sections,
        2,
        '<span class="section-tag">Presentación</span><h2>Guía de presentación premium</h2>',
    )
    return html_shell("Guía de Presentación", pages)


def build_mensajes_html():
    blocks = ""
    for cat, items in MENSAJES_PREMIUM.items():
        for m in items:
            blocks += f'<div class="mensaje"><div class="mensaje-cat">{cat.title()}</div>{m}</div>'
    return html_shell(
        "Mensajes Premium",
        f"""<div class="page">{page_header()}
          <span class="section-tag">WhatsApp</span>
          <h2>Mensajes premium para WhatsApp</h2>
          <p>Copia, adapta [precio] y [sabor] según tu menú.</p>
          {blocks}
        </div>""",
    )


def build_menu_html():
    rows = "".join([
        menu_row("Cheesecake de fresa", "2.50"),
        menu_row("Brownie relleno", "2.80"),
        menu_row("Chocolate bañado", "3.00"),
        menu_row("", "", "Otro sabor premium"),
        menu_row("", "", "Otro sabor premium"),
    ])
    combo_rows = "".join([
        menu_row("Combo familiar x6", "12.00", "Nombre del combo"),
        menu_row("Caja fin de semana", "15.00", "Nombre del combo"),
    ])
    return html_shell(
        "Menú Premium Editable",
        f"""<div class="page cover cover-page screen-compact">
  <div class="cover-icon">📋</div>
  <h1>Menú Premium Editable</h1>
  <p class="subtitle">Completa y copia el texto para WhatsApp</p>
</div>
<div class="page menu-edit menu-page screen-compact">
  {page_header()}
  <div class="menu-field"><label for="negocio">Nombre de tu negocio</label><input type="text" id="negocio" placeholder="Ej: Paletas de María"></div>
  <div class="menu-modelo" id="menu-premium">
    <h3>🍓 Menú Premium</h3>
    {rows}
  </div>
  <div class="menu-modelo" id="menu-combos" style="background:#FFF8E7;margin-top:16px">
    <h3>📦 Combos</h3>
    {combo_rows}
  </div>
  <div class="menu-field" style="margin-top:14px"><label for="nota">Nota al pie (opcional)</label><input type="text" id="nota" placeholder="Pedidos con 24h. Entrega en tu zona."></div>
  <button type="button" class="btn-copy" onclick="copiarMenu()">Copiar menú premium</button>
  <pre id="resultado" class="menu-output"></pre>
</div>
<script>
function copiarMenu() {{
  const n = document.getElementById('negocio').value.trim() || 'Mis paletas';
  const sabores = document.querySelectorAll('#menu-premium .menu-linea-input');
  const combos = document.querySelectorAll('#menu-combos .menu-linea-input');
  let lineas = ['🍓 *' + n + '* — Menú Premium', '', '*Sabores especiales*'];
  sabores.forEach(row => {{
    const s = row.querySelector('.sabor').value.trim();
    const p = row.querySelector('.precio').value.trim();
    if (s) lineas.push(p ? `• ${{s}} — $${{p}}` : `• ${{s}}`);
  }});
  lineas.push('', '*Combos*');
  combos.forEach(row => {{
    const s = row.querySelector('.sabor').value.trim();
    const p = row.querySelector('.precio').value.trim();
    if (s) lineas.push(p ? `• ${{s}} — $${{p}}` : `• ${{s}}`);
  }});
  const nota = document.getElementById('nota').value.trim();
  if (nota) lineas.push('', '_' + nota + '_');
  const txt = lineas.join('\\n');
  const out = document.getElementById('resultado');
  out.textContent = '✅ Copiado! Pega en WhatsApp:\\n\\n' + txt;
  out.classList.add('visible');
  navigator.clipboard.writeText(txt).catch(() => {{}});
}}
</script>""",
        interactive=True,
    )


def build_entrega_html():
    return """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu complemento Premium</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root { --rosa: #FF4F8B; --crema: #FFF4E6; --chocolate: #5C2E1F; --gold: #D4A017; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Nunito', system-ui, sans-serif; background: linear-gradient(160deg, var(--crema), #FFF8E7 50%, #FFE8F0); min-height: 100vh; color: var(--chocolate); }
.container { max-width: 720px; margin: 0 auto; padding: 32px 20px; }
header { text-align: center; margin-bottom: 32px; }
header .icon { font-size: 56px; }
header h1 { font-size: 28px; font-weight: 800; margin: 12px 0 8px; }
header p { color: #6B5E57; font-size: 15px; }
.badge { display: inline-block; background: linear-gradient(135deg, var(--gold), #ffc94a); color: var(--chocolate); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 14px; border-radius: 50px; margin-bottom: 16px; }
.card { background: white; border-radius: 18px; padding: 20px 24px; margin-bottom: 14px; box-shadow: 0 4px 20px rgba(92,46,31,0.08); display: flex; align-items: center; gap: 16px; text-decoration: none; color: inherit; transition: transform 0.15s; }
.card:hover { transform: translateY(-2px); }
.card-icon { font-size: 32px; flex-shrink: 0; }
.card-info h3 { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
.card-info p { font-size: 12px; color: #6B5E57; }
.card-arrow { margin-left: auto; color: var(--rosa); font-weight: 800; font-size: 18px; }
.section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6B5E57; margin: 24px 0 12px; }
.steps { background: white; border-radius: 18px; padding: 20px 24px; box-shadow: 0 4px 20px rgba(92,46,31,0.08); margin-bottom: 20px; }
.steps ol { margin-left: 20px; }
.steps li { margin-bottom: 8px; font-size: 14px; }
.kit-link { display: block; text-align: center; margin-top: 24px; font-size: 14px; }
.kit-link a { color: var(--rosa); font-weight: 700; }
footer { text-align: center; margin-top: 32px; font-size: 12px; color: #6B5E57; }
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="badge">Complemento premium</div>
    <div class="icon">✨</div>
    <h1>¡Tu complemento está listo!</h1>
    <p>Paletas Premium y Combos Rentables — recetas, combos y materiales extra.</p>
  </header>
  <div class="steps">
    <ol>
      <li><strong>Kit Premium</strong> — lee la introducción y elige tus primeras recetas</li>
      <li><strong>Combos</strong> — agrega 1 o 2 combos a tu menú</li>
      <li><strong>Menú Editable</strong> — copia el texto para WhatsApp</li>
      <li><strong>Mensajes</strong> — anuncia sabores especiales y fechas</li>
    </ol>
  </div>
  <div class="section-title">Descarga tus archivos</div>
  <a class="card" href="produto/Kit_Premium_Paletas.html" target="_blank">
    <div class="card-icon">📘</div>
    <div class="card-info"><h3>Kit Premium (HTML)</h3><p>20 recetas premium + guía</p></div>
    <span class="card-arrow">→</span>
  </a>
  <a class="card" href="produto/Combos_Rentables.html" target="_blank">
    <div class="card-icon">📦</div>
    <div class="card-info"><h3>Combos Rentables</h3><p>10 ideas con precios guía</p></div>
    <span class="card-arrow">→</span>
  </a>
  <a class="card" href="produto/Menu_Premium_Editable.html" target="_blank">
    <div class="card-icon">📋</div>
    <div class="card-info"><h3>Menú Premium Editable</h3><p>Copia y pega en WhatsApp</p></div>
    <span class="card-arrow">→</span>
  </a>
  <a class="card" href="produto/Mensajes_Premium.html" target="_blank">
    <div class="card-icon">💬</div>
    <div class="card-info"><h3>Mensajes Premium</h3><p>Textos para combos y fechas</p></div>
    <span class="card-arrow">→</span>
  </a>
  <a class="card" href="produto/Fechas_Especiales.html" target="_blank">
    <div class="card-icon">🎉</div>
    <div class="card-info"><h3>Fechas Especiales</h3><p>Ideas por temporada</p></div>
    <span class="card-arrow">→</span>
  </a>
  <a class="card" href="produto/Guia_Presentacion.html" target="_blank">
    <div class="card-icon">📸</div>
    <div class="card-info"><h3>Guía de Presentación</h3><p>Fotos, nombres y empaque</p></div>
    <span class="card-arrow">→</span>
  </a>
  <p class="kit-link">¿Necesitas el kit principal? <a href="/paletas-de-whatsapp/entrega.html">Acceder al Kit Paletas para WhatsApp</a></p>
  <footer>© 2026 Paletas para WhatsApp · Complemento digital</footer>
</div>
</body>
</html>"""


def sync_public():
    import shutil
    public = ROOT.parent / "public" / "paletas-premium"
    public_prod = public / "produto"
    public_prod.mkdir(parents=True, exist_ok=True)
    for f in PRODUTO.glob("*.html"):
        shutil.copy2(f, public_prod / f.name)
    shutil.copy2(ROOT / "entrega.html", public / "entrega.html")
    print("  OK sync -> public/paletas-premium/")


def main():
    PRODUTO.mkdir(parents=True, exist_ok=True)
    files = {
        "Kit_Premium_Paletas.html": build_kit_html(),
        "Combos_Rentables.html": build_combos_html(),
        "Menu_Premium_Editable.html": build_menu_html(),
        "Mensajes_Premium.html": build_mensajes_html(),
        "Fechas_Especiales.html": build_fechas_html(),
        "Guia_Presentacion.html": build_guia_html(),
    }
    for name, content in files.items():
        (PRODUTO / name).write_text(content, encoding="utf-8")
        print(f"  OK {name}")
    (ROOT / "entrega.html").write_text(build_entrega_html(), encoding="utf-8")
    print("  OK entrega.html")
    sync_public()
    print("\nComplemento premium generado.")


if __name__ == "__main__":
    main()
