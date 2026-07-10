import { readFileSync, writeFileSync } from 'fs';

const path = 'src/app/main.js';
let s = readFileSync(path, 'utf8');

const start = s.indexOf('function renderRecipeListTools(recipeCount) {');
const end = s.indexOf('function renderKitSectionNav() {');
if (start < 0 || end < 0) {
  console.error('markers not found', start, end);
  process.exit(1);
}

const next = `function renderRecipeListTools(recipeCount) {
  return \`
    <div class="menu-list-tools">
      <p class="menu-list-count" id="menu-list-count">\${recipeCount} recetas</p>
      <div class="menu-list-actions">
        <button type="button" class="menu-list-action" id="menu-expand-all">Abrir</button>
        <button type="button" class="menu-list-action" id="menu-collapse-all">Cerrar</button>
      </div>
    </div>
  \`;
}

function renderRecipeCatalogToggle() {
  const locked = !hasPremiumAccess();
  return \`
    <div class="catalog-toggle" role="tablist" aria-label="Catálogo">
      <button type="button" class="catalog-btn \${recipeCatalog === 'base' ? 'active' : ''}" data-recipe-catalog="base" role="tab" aria-selected="\${recipeCatalog === 'base'}">Kit</button>
      <button type="button" class="catalog-btn \${recipeCatalog === 'premium' ? 'active' : ''}" data-recipe-catalog="premium" role="tab" aria-selected="\${recipeCatalog === 'premium'}">
        Premium\${locked ? ' · 🔒' : ''}
      </button>
    </div>
  \`;
}

function renderRecipeFilterBar() {
  const filters = recipeFiltersForLine();
  if (filters.length <= 1) return '';
  return \`
    <div class="recipe-filters" id="recipe-filters" role="listbox" aria-label="Filtrar por tipo">
      \${filters
        .map(
          (f) => \`
        <button type="button" class="recipe-filter-btn \${recipeFilter === f.id ? 'active' : ''}" data-recipe-filter="\${f.id}" role="option" aria-selected="\${recipeFilter === f.id}">
          \${f.label}
        </button>
      \`
        )
        .join('')}
    </div>
  \`;
}

function renderBonus() {
  const kit = kitContentForLine();
  const isPremium = recipeCatalog === 'premium';
  const title = isPremium ? kit.premiumRecipeTitle : kit.recipeTitle;
  const showFilters = !isPremium || hasPremiumAccess();

  let listHtml = '';
  if (!hasKitContentAccess()) {
    listHtml = \`<div class="premium-locked-card">\${renderKitLockedCard(title)}</div>\`;
  } else if (isPremium && !hasPremiumAccess()) {
    listHtml = \`
      <div class="premium-locked-card">
        <h3>Complemento premium</h3>
        <p>Las recetas premium van incluidas en <strong>\${escapeHtml(kit.upsellName)}</strong>.</p>
        \${renderPremiumUpsell()}
      </div>
    \`;
  } else {
    const recipes = isPremium ? kit.recipesPremium : kit.recipes;
    listHtml = \`
      \${renderRecipeListTools(recipes.length)}
      <div class="menu-list" id="menu-list">\${renderMenuByWeek(recipes)}</div>
      <p class="menu-empty hidden" id="menu-empty">Ninguna receta encontrada.</p>\`;
  }

  return \`
    <div class="bonus-page">
      <div class="kit-toolbar">
        \${renderRecipeCatalogToggle()}
        \${
          showFilters
            ? \`
          <div class="search-wrap">
            \${ICONS.search}
            <input type="search" class="bonus-search" id="bonus-search" placeholder="Buscar sabor..." autocomplete="off">
          </div>
          \${renderRecipeFilterBar()}
        \`
            : ''
        }
      </div>
      \${listHtml}
    </div>
  \`;
}

`;

s = s.slice(0, start) + next + s.slice(end);
writeFileSync(path, s);
console.log('updated recipe toolbar');
