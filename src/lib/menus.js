import { db, isFirebaseConfigured } from './firebase.js';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

const SLUG_RE = /^[a-z0-9-]{3,32}$/;
const LOCAL_KEY = (uid, lineId = 'paletas') => `menu_web_draft_v3_${lineId}_${uid}`;
const MAX_DATA_URL_CHARS = 70_000;
/** Firebase Storage download URLs can be long */
const MAX_HTTPS_URL = 2500;

const LINE_MENU_DEFAULTS = {
  paletas: {
    tagline: 'Paletas artesanales',
    categories: [
      { id: 'cat_frutales', name: 'Frutales' },
      { id: 'cat_cremosas', name: 'Cremosas' },
      { id: 'cat_especiales', name: 'Especiales' },
    ],
  },
  postres: {
    tagline: 'Postres en vaso',
    categories: [
      { id: 'cat_cremosos', name: 'Cremosos' },
      { id: 'cat_frutales', name: 'Frutales' },
      { id: 'cat_especiales', name: 'Especiales' },
    ],
  },
};

export const DEFAULT_CATEGORIES = LINE_MENU_DEFAULTS.paletas.categories;

export function canUseMenusCloud() {
  return isFirebaseConfigured && Boolean(db);
}

export function normalizeSlug(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

export function isValidSlug(slug) {
  return SLUG_RE.test(slug);
}

export function normalizeWhatsapp(raw) {
  return String(raw || '').replace(/\D/g, '');
}

export function newId(prefix = 'i') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function newItemId() {
  return newId('i');
}

export function newCategoryId() {
  return newId('c');
}

function sanitizeImage(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (s.startsWith('data:image/') && s.length <= MAX_DATA_URL_CHARS) return s;
  if (/^https:\/\//i.test(s) && s.length <= MAX_HTTPS_URL) return s;
  return '';
}

export function emptyItem(categoryId = '') {
  return {
    id: newItemId(),
    name: '',
    price: '',
    description: '',
    categoryId: categoryId || '',
    image: '',
    available: true,
  };
}

export function emptyMenuDraft(lineId = 'paletas') {
  const defaults = LINE_MENU_DEFAULTS[lineId] || LINE_MENU_DEFAULTS.paletas;
  return {
    slug: '',
    published: false,
    businessName: '',
    tagline: defaults.tagline,
    whatsapp: '',
    phone: '',
    coverImage: '',
    logoImage: '',
    categories: defaults.categories.map((c) => ({ ...c })),
    items: [],
    note: '',
    updatedAt: 0,
  };
}

function normalizeCategories(raw) {
  if (!Array.isArray(raw) || !raw.length) {
    return DEFAULT_CATEGORIES.map((c) => ({ ...c }));
  }
  const seen = new Set();
  const out = [];
  for (const cat of raw) {
    const id = String(cat?.id || newCategoryId());
    const name = String(cat?.name || '').trim().slice(0, 40);
    if (!name || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name });
  }
  return out.length ? out : DEFAULT_CATEGORIES.map((c) => ({ ...c }));
}

function normalizeItems(raw, categories) {
  const catIds = new Set(categories.map((c) => c.id));
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      let categoryId = String(item?.categoryId || '').trim();
      if (categoryId && !catIds.has(categoryId)) categoryId = categories[0]?.id || '';
      return {
        id: String(item?.id || newItemId()),
        name: String(item?.name || '').trim().slice(0, 80),
        price: String(item?.price ?? '').trim().slice(0, 24),
        description: String(item?.description || '').trim().slice(0, 180),
        categoryId: categoryId || categories[0]?.id || '',
        image: sanitizeImage(item?.image),
        available: item?.available !== false,
        _order: Number.isFinite(item?.sort) ? item.sort : index,
      };
    })
    .filter((item) => item.name || item.price || item.image || item.description)
    .sort((a, b) => a._order - b._order)
    .map(({ _order, ...item }) => item);
}

export function normalizeMenuPayload(data = {}) {
  const categories = normalizeCategories(data.categories);
  const items = normalizeItems(data.items, categories);

  return {
    slug: normalizeSlug(data.slug),
    published: Boolean(data.published),
    businessName: String(data.businessName || '').trim().slice(0, 60),
    tagline: String(data.tagline || '').trim().slice(0, 100),
    whatsapp: normalizeWhatsapp(data.whatsapp),
    phone: normalizeWhatsapp(data.phone),
    coverImage: sanitizeImage(data.coverImage),
    logoImage: sanitizeImage(data.logoImage),
    categories,
    items,
    note: String(data.note || '').trim().slice(0, 240),
    updatedAt: Number(data.updatedAt) || 0,
  };
}

/** @deprecated use menu-images.js, kept for any leftover imports */
export { compressImageFile } from './menu-images.js';

function draftRef(uid, lineId = 'paletas') {
  return doc(db, 'users', uid, 'private', `menu_${lineId}`);
}

function legacyDraftRef(uid) {
  return doc(db, 'users', uid, 'private', 'menu');
}

function publicRef(slug) {
  return doc(db, 'menus', slug);
}

function readLocalDraft(uid, lineId = 'paletas') {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(LOCAL_KEY(uid, lineId));
    if (!raw) {
      if (lineId === 'paletas') {
        const legacyV2 = localStorage.getItem(`menu_web_draft_v2_${uid}`);
        if (legacyV2) return normalizeMenuPayload(JSON.parse(legacyV2));
        const legacyV1 = localStorage.getItem(`menu_web_draft_v1_${uid}`);
        if (legacyV1) return normalizeMenuPayload(JSON.parse(legacyV1));
      }
      return null;
    }
    return normalizeMenuPayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocalDraft(uid, draft, lineId = 'paletas') {
  if (!uid) return;
  try {
    localStorage.setItem(LOCAL_KEY(uid, lineId), JSON.stringify(draft));
  } catch {
    /* quota, try without heavy images */
    try {
      const slim = {
        ...draft,
        coverImage: '',
        logoImage: '',
        items: draft.items.map((i) => ({ ...i, image: '' })),
      };
      localStorage.setItem(LOCAL_KEY(uid, lineId), JSON.stringify(slim));
    } catch {
      /* ignore */
    }
  }
}

export function publicMenuUrl(slug) {
  const s = normalizeSlug(slug);
  if (!s) return '';
  return `${window.location.origin}/m/${s}`;
}

export function publicMenuPreviewPath(slug) {
  const s = normalizeSlug(slug);
  if (!s) return '';
  return `/m.html?slug=${encodeURIComponent(s)}`;
}

export async function loadMenuDraft(uid, lineId = 'paletas') {
  if (!uid) return emptyMenuDraft(lineId);

  if (canUseMenusCloud()) {
    try {
      const snap = await getDoc(draftRef(uid, lineId));
      if (snap.exists()) {
        const data = snap.data();
        const draft = normalizeMenuPayload({
          ...data,
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
        });
        writeLocalDraft(uid, draft, lineId);
        return draft;
      }

      if (lineId === 'paletas') {
        const legacySnap = await getDoc(legacyDraftRef(uid));
        if (legacySnap.exists()) {
          const data = legacySnap.data();
          const draft = normalizeMenuPayload({
            ...data,
            updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
          });
          writeLocalDraft(uid, draft, lineId);
          return draft;
        }
      }
    } catch {
      /* fall through */
    }
  }

  return readLocalDraft(uid, lineId) || emptyMenuDraft(lineId);
}

function draftDocFields(draft) {
  return {
    slug: draft.slug,
    published: draft.published,
    businessName: draft.businessName,
    tagline: draft.tagline,
    whatsapp: draft.whatsapp,
    phone: draft.phone,
    coverImage: draft.coverImage,
    logoImage: draft.logoImage,
    categories: draft.categories,
    items: draft.items,
    note: draft.note,
    updatedAt: serverTimestamp(),
  };
}

export async function saveMenuDraft(uid, rawDraft, lineId = 'paletas') {
  const draft = normalizeMenuPayload({
    ...rawDraft,
    updatedAt: Date.now(),
  });
  writeLocalDraft(uid, draft, lineId);

  if (!canUseMenusCloud() || !uid) {
    return { ok: true, draft, cloud: false };
  }

  try {
    await setDoc(draftRef(uid, lineId), draftDocFields(draft), { merge: true });
    return { ok: true, draft, cloud: true };
  } catch (err) {
    return { ok: false, draft, cloud: false, error: err };
  }
}

function publicPayload(uid, draft) {
  return {
    ownerUid: uid,
    published: Boolean(draft.published),
    businessName: draft.businessName,
    tagline: draft.tagline,
    whatsapp: draft.whatsapp,
    phone: draft.phone,
    coverImage: draft.coverImage,
    logoImage: draft.logoImage,
    categories: draft.categories,
    items: draft.items.filter((i) => i.name),
    note: draft.note,
    updatedAt: serverTimestamp(),
  };
}

export async function publishMenu(uid, rawDraft, { previousSlug = '', lineId = 'paletas' } = {}) {
  const draft = normalizeMenuPayload(rawDraft);

  if (!draft.businessName) {
    return { ok: false, error: 'missing_business', draft };
  }
  if (!draft.slug || !isValidSlug(draft.slug)) {
    return { ok: false, error: 'invalid_slug', draft };
  }
  if (!draft.whatsapp || draft.whatsapp.length < 8) {
    return { ok: false, error: 'invalid_whatsapp', draft };
  }
  if (!draft.items.some((i) => i.name && i.available !== false)) {
    return { ok: false, error: 'missing_items', draft };
  }

  const saved = await saveMenuDraft(uid, draft, lineId);
  if (!saved.ok && canUseMenusCloud()) {
    return { ok: false, error: 'save_failed', draft: saved.draft };
  }

  if (!canUseMenusCloud()) {
    return { ok: true, draft: saved.draft, cloud: false, warning: 'demo' };
  }

  const slug = draft.slug;
  const prev = normalizeSlug(previousSlug);

  try {
    const ref = publicRef(slug);
    const existing = await getDoc(ref);

    if (existing.exists()) {
      const owner = existing.data()?.ownerUid;
      if (owner && owner !== uid) {
        return { ok: false, error: 'slug_taken', draft: saved.draft };
      }
      await setDoc(
        ref,
        {
          ...publicPayload(uid, draft),
          createdAt: existing.data()?.createdAt || serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await setDoc(ref, {
        ...publicPayload(uid, draft),
        createdAt: serverTimestamp(),
      });
    }

    if (prev && prev !== slug) {
      try {
        const oldSnap = await getDoc(publicRef(prev));
        if (oldSnap.exists() && oldSnap.data()?.ownerUid === uid) {
          await deleteDoc(publicRef(prev));
        }
      } catch {
        /* best-effort */
      }
    }

    return { ok: true, draft: saved.draft, cloud: true };
  } catch (err) {
    if (err?.code === 'permission-denied') {
      return { ok: false, error: 'slug_taken', draft: saved.draft };
    }
    return { ok: false, error: 'publish_failed', draft: saved.draft, detail: err };
  }
}

export async function unpublishMenu(uid, rawDraft, lineId = 'paletas') {
  const draft = normalizeMenuPayload({ ...rawDraft, published: false });
  const saved = await saveMenuDraft(uid, draft, lineId);

  if (canUseMenusCloud() && draft.slug && isValidSlug(draft.slug)) {
    try {
      const ref = publicRef(draft.slug);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data()?.ownerUid === uid) {
        await setDoc(ref, { published: false, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch {
      /* ignore */
    }
  }

  return { ok: true, draft: saved.draft, cloud: canUseMenusCloud() };
}

export async function getPublicMenu(slug) {
  const s = normalizeSlug(slug);
  if (!s || !isValidSlug(s)) return null;
  if (!canUseMenusCloud()) return null;

  try {
    const snap = await getDoc(publicRef(s));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data.published) return null;
    if (data.ownerUid == null) return null;
    return normalizeMenuPayload({ ...data, slug: s, published: true });
  } catch {
    return null;
  }
}
