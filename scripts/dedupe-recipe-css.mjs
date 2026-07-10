import { readFileSync, writeFileSync } from 'fs';

const path = 'src/app/app.css';
let s = readFileSync(path, 'utf8');

function removeNthOccurrence(marker, n, endFn) {
  let idx = 0;
  let count = 0;
  let start = -1;
  while ((idx = s.indexOf(marker, idx)) !== -1) {
    count += 1;
    if (count === n) {
      start = idx;
      break;
    }
    idx += 1;
  }
  if (start < 0) return false;
  const end = endFn(start);
  if (end < 0) return false;
  s = s.slice(0, start) + s.slice(end);
  return true;
}

function skipTrailingNewlines(pos) {
  while (s[pos] === '\r' || s[pos] === '\n') pos += 1;
  return pos;
}

function endAfterClosingBrace(from, selector) {
  const sel = s.indexOf(selector, from);
  if (sel < 0) return -1;
  return skipTrailingNewlines(s.indexOf('}', sel) + 1);
}

// Cardápio: drop duplicate search-wrap / bonus-search (keep kit-hub versions)
{
  const cardapio = s.indexOf('/* ── Cardápio ── */');
  if (cardapio >= 0) {
    const after = cardapio + '/* ── Cardápio ── */'.length;
    const searchStart = s.indexOf('.search-wrap {', after);
    if (searchStart >= 0 && searchStart < after + 400) {
      const end = endAfterClosingBrace(searchStart, '.bonus-search:focus');
      if (end > 0) {
        s = s.slice(0, searchStart) + s.slice(end);
        console.log('removed cardapio search-wrap');
      }
    }
  }
}

if (
  removeNthOccurrence('.menu-list-tools {', 2, (start) =>
    endAfterClosingBrace(start, '.menu-list-action:hover')
  )
) {
  console.log('removed 2nd menu-list-tools');
}

if (
  removeNthOccurrence('.kit-toolbar {', 2, (start) => {
    const end = s.indexOf('.topbar-brand-emoji', start);
    return end;
  })
) {
  console.log('removed 2nd kit-toolbar');
}

if (
  removeNthOccurrence('.catalog-toggle {', 2, (start) =>
    endAfterClosingBrace(start, '.recipe-filter-btn.active')
  )
) {
  console.log('removed 2nd catalog/filters');
}

writeFileSync(path, s);
console.log('final counts:');
for (const sel of [
  '.kit-toolbar {',
  '.catalog-toggle {',
  '.search-wrap {',
  '.menu-list-tools {',
  '.recipe-filters {',
  '.catalog-btn {',
]) {
  console.log(sel, (s.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length);
}
