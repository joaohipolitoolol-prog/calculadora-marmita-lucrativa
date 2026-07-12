# Diagnóstico WhatsApp — Arquitetura, wireframes e prompts

Funil próprio (não é cópia de quiz genérico): o visitante acredita que está **descobrindo o bloqueio** que impede as vendas. No final, o kit aparece como a **solução personalizada** daquele diagnóstico.

URL: `/diagnostico`

---

## 1. Arquitetura

```
diagnostico.html                 → shell HTML (pixel, fonts, app shell)
src/diagnostico/
  main.js                        → bootstrap + analytics page_view
  config.js                      → preço, checkout Hotmart, itens do kit
  copy.js                        → telas, labels, diagnósticos, personalização
  engine.js                      → estado, navegação, render, microinterações
  icons.js                       → SVGs inline (zero request de ícones)
  diagnostico.css                → UI mobile-first estilo app premium
```

### Estado

```js
{
  index,          // posição em SCREEN_FLOW
  answers: {
    experience,   // never | tried | selling
    goal,         // extra | replace | test
    blocker,      // precio | ventas | recetas | whatsapp | empezar
    cooking,      // beginner | mid | good
    whatsappLevel,// daily | sometimes | low
    speed,        // today | week | explore
  },
  diagnosisId,    // precio | confianza | recetas | whatsapp | inicio
}
```

### Lógica de diagnóstico

1. Prioridade máxima: resposta de `blocker`
2. Fallbacks: cozinha iniciante → `recetas`; WhatsApp baixo → `whatsapp`; nunca vendeu → `confianza`
3. Cada diagnóstico destaca itens do kit com tag **Para ti**

### Eventos analytics

| Evento | Quando |
|--------|--------|
| `page_view` (diagnostico) | Load |
| `diagnostico_start` | Boot |
| `diagnostico_step` | Cada avanço |
| `diagnostico_result` | Após loading (com answers + diagnosis) |
| `cta_click` / Meta `InitiateCheckout` | Clique no CTA final |

---

## 2. Mapa de navegação (15 telas)

```
welcome
  → q_experience
  → q_goal
  → affirm_1          (personalizado por experience + goal)
  → q_blocker         ★ driver do diagnóstico
  → q_cooking
  → q_whatsapp
  → q_speed
  → affirm_2          (resume respostas)
  → loading           (4 passos, sem %)
  → diagnosis         (resultado personalizado)
  → insight           (ponte: “não precisas de X, precisas de Y”)
  → kit_match         (kit como solução do bloqueio)
  → trust             (objeções suaves: casa, preço, garantia)
  → offer             (preço + includes + FAQs naturais + CTA checkout)
```

Tempo alvo: **2–4 min**.

---

## 3. Wireframes (texto)

### W1 — Welcome
```
[ ambient gradient ]
  (orb rosa + verde)
  [ ícone search em card branco ]
Diagnóstico WhatsApp
Título grande
Subcopy
Nota: Sin videos · Sin inversión grande · Solo WhatsApp
[ CTA rosa full-width ]
microcopy
```

### W2–W6 — Perguntas
```
[ barra progresso ]
ícone em tile
Título
Sub
┌ option ┐  ícone | label + hint | ○
┌ option ┐
┌ option ┐
```

### W7 — Affirm
```
(check verde grande — pop)
Título celebração
Body personalizado
chip meta
[ Continuar ]
```

### W8 — Loading
```
spinner
"Armando tu diagnóstico…"
lista de 4 passos que acendem um a um (done = verde)
```

### W9 — Diagnosis
```
badge "Bloqueo principal"
título do bloqueio
body personalizado (experience tone)
card "Lo que necesitas"
[ CTA ]
```

### W10 — Offer
```
eyebrow "Tu plan personalizado"
título (varia por speed)
price card US$ 7,49 + garantía
lista includes
details/objeções
[ CTA checkout Hotmart ]
nota de fechamento
```

---

## 4. Copy — princípios

- Espanhol LATAM (mulheres 18–50)
- Sem mentiras, sem escassez falsa, sem % inventada, sem Pix falso
- Personalização real: experience/goal/blocker/cooking/WA/speed alteram textos
- Oferta inevitável: diagnóstico → necessidade → kit como match

### Bridge-chave (insight)

> No necesitas decenas de recetas.  
> Necesitas un producto bonito, saber cuánto cobrar y publicar de la forma correcta en WhatsApp.

(varia por diagnóstico; ver `DIAGNOSES` em `copy.js`)

---

## 5. Gamificação (com propósito)

| Técnica | Onde |
|---------|------|
| Progressão | Barra superior |
| Micro-vitória | Affirm 1 e 2 + burst ao selecionar |
| Curiosidade | Loading em 4 etapas |
| Antecipação | “Ver mi diagnóstico” |
| Personalização | Tags “Para ti” no kit |
| Feedback instantâneo | Option selected + ambient pulse |
| Recompensa | Diagnóstico nomeado (não genérico) |

---

## 6. Animações / microinterações

1. **Stage in/out** — fade + translateY (220–350ms)
2. **Option select** — borda rosa + check scale + particle burst
3. **Affirm pop** — badge verde scale
4. **Loader ring** — spin contínuo
5. **Load steps** — active → done sequencial (~900ms cada)
6. **Ambient pulse** — brilho sutil a cada transição
7. **Orbs welcome** — float lento
8. **`prefers-reduced-motion`** — tudo desliga

---

## 7. Performance

- Ícones SVG inline (0 HTTP)
- CSS/JS via Vite (code-split por entry)
- Font Nunito só 600/700/800
- Sem libs de UI
- Mobile-first, max-width 440px
- Lazy: não há imagens pesadas no fluxo (prompts abaixo para assets opcionais)

---

## 8. Prompts de imagens

Estilo global (colar no início de TODOS os prompts):

```
Style lock: clean premium mobile-app aesthetic, soft natural light, airy white space,
subtle pink (#E8437A) and warm brown (#3D2228) accents, WhatsApp green (#25D366) sparingly,
photoreal product + soft illustrated UI overlays when needed, no clutter, no fake UI text
gibberish, no watermarks, no logos of other brands, Latin American home kitchen vibe,
women 25–40 as lifestyle subjects when people appear, shot on iPhone-quality realism,
shallow depth of field, high-end food blog meets Stripe/Apple marketing.
Negative: neon, dark mode, purple gradients, stock-photo handshakes, luxury mansion,
fake money stacks, exaggerated luxury cars, crowded collage, comic cartoon, low-res.
```

### 8.1 Hero — Diagnóstico

```
Hero square 1080x1080 for Diagnóstico WhatsApp app welcome. Soft cream-pink background
gradient. Center: a modern white smartphone floating slightly, screen showing a clean
WhatsApp-style chat with a colorful homemade paleta (popsicle) photo and a neat price
menu card. Around the phone: three soft translucent glass orbs in blush pink and mint
green, very minimal. Top soft label space empty for overlay text. Mood: calm, premium,
hopeful, “this is an app not an ad”. Soft shadow under phone. No text on image.
```

### 8.2 Authority / lifestyle

```
Lifestyle photo, 4:5, Latin American woman 30s in a bright small home kitchen, holding
a tray of homemade fruit paletas (strawberry, mango, coconut), looking at her phone with
a calm half-smile. Soft morning light from a window, pinkish cream walls, no brand logos.
Feels independent and quiet success, not influencer glam. Shallow DOF, editorial food
business magazine quality. No text.
```

### 8.3 Product — kit mockup

```
Flat-lay product mockup on soft white marble with blush shadows: printed recipe cards with
paleta photos, a phone showing WhatsApp menu, a small notepad with “precio” handwritten,
wooden sticks, fresh strawberries and mango slices. Clean composition, centered negative
space. Premium digital-product photography. Colors: white, pink, chocolate brown, green
leaves. No fake currency, no watermarks, no text-heavy papers (blur fine print).
```

### 8.4 WhatsApp scene

```
Close-up of a hand holding a smartphone, screen clearly showing a WhatsApp chat with a
customer asking for “paletas de fresa”, and a reply with a beautiful paleta photo and
prices. Background blurred home table with real paletas. Soft pink ambient light.
Photoreal, premium, trustworthy. No unread badge spam, no fake viral counts.
```

### 8.5 Resultado / diagnóstico visual

```
Minimal illustration-photo hybrid: soft white canvas, a subtle diagnostic “scan” ring
in pink around a simple icon of a chat bubble + popsicle silhouette, delicate particles
of mint green. Feels like a health/app diagnosis screen from a billion-dollar consumer
app (Duolingo/Apple Health calmness). Lots of whitespace. No numbers, no percentages.
```

### 8.6 Loading visual (opcional)

```
Abstract soft loading visual: three translucent rounded cards stacking with gentle blur,
pink and mint accents on cream background, a soft searching magnifying glass made of glass
morphism. Ultra minimal, motion-design still frame, Apple-like. No percentage text.
```

### 8.7 Ícones (set consistente — se quiser PNG além dos SVGs)

Para cada ícone (search, chat, calc, recipe, shield, home, clock, gift, rocket, warning):

```
App icon glyph, 512x512 transparent PNG, rounded-square soft tile background in
#FFF5F9, single line-weight icon in #E8437A, 2px stroke feel, rounded terminals,
Duolingo/iOS SF Symbols simplicity, centered, no text, no gradients on the glyph itself,
soft drop shadow under tile. Subject: {ICON_SUBJECT}.
```

Subjects:
- search → magnifying glass
- chat → WhatsApp-like rounded chat bubble (generic, not trademark)
- calc → mini calculator
- recipe → open card with lines
- shield → shield with check
- home → simple house
- clock → clock face
- gift → gift box
- rocket → small rocket
- warning → soft alert triangle
- dollar → coin with subtle mark
- phone → smartphone outline
- book → booklet
- box → package
- menu → document list
- check → checkmark circle
- star → soft star
- user → person silhouette
- heart → heart
- lock → padlock
- spark → sparkle burst
- wa → chat + phone hybrid
- arrow → right arrow
- gift already listed

### 8.8 Backgrounds

```
Subtle full-bleed mobile background 1170x2532, soft cream #FFF6F9 base with very faint
radial blush pink glow top-center and mint whisper bottom-right, almost invisible grain,
no shapes, no objects — atmosphere only for app chrome. Quiet, expensive, airy.
```

### 8.9 Cards de resultado (5 diagnósticos)

Mesmo estilo, troca só o objeto central:

```
Square card 1080x1080, white soft panel, centered object metaphor for diagnosis "{THEME}",
blush pink rim light, mint accent particle, lots of whitespace, premium app result card,
no text. Photoreal mini still-life.
```

Themes:
- precio → small calculator + sticky note + one paleta
- confianza → phone with heart reaction near a paleta photo
- recetas → recipe card + strawberries + mold
- whatsapp → phone chat blur + paleta
- inicio → open notebook with checklist + wooden stick

### 8.10 Mockup checkout / oferta

```
Premium mobile screenshot mockup of a clean offer screen (blank text areas), soft device
bezel, floating above cream-pink gradient, tiny kit items (menu, calculator, recipes)
orbiting softly blurred. Marketing still for ads. No readable lorem ipsum — keep UI
labels empty or abstract lines.
```

---

## 9. Otimizações de conversão (revisão final)

Mantido porque aumenta compra:
- Diagnóstico nomeado (especificidade > generalidade)
- Bridge “não precisas de X” (reframe antes da oferta)
- Tags “Para ti” alinhadas ao bloqueio
- Objeções dentro da oferta (não FAQ frio)
- Preço ancorado em “menos que errar o preço”
- Garantia 30 dias + acesso imediato + desde casa
- CTA só depois do diagnóstico (comprometimento progressivo)

Removido / evitado:
- Contadores falsos, escassez, % inventada
- Perguntas demais (só as que mudam o diagnóstico ou a copy)
- Cards decorativos sem ação
- Nome obrigatório (fricção sem ROI neste ticket)

### Próximo teste A/B sugerido
1. CTA welcome: “Empezar diagnóstico” vs “Descubrir mi bloqueo”
2. Ordem: `q_blocker` mais cedo (após experience) vs atual
3. Entrada na LP: CTA secundário “Haz tu diagnóstico gratis” → `/diagnostico`
