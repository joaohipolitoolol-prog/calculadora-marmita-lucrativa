/**
 * Cloud sync for kit workspace: message vars, message edits, plan/playbook progress, orders.
 * localStorage remains instant UX; Firestore private doc is backup across devices.
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

const SYNC_PREFIX = 'kit_workspace_meta_';

function workspaceRef(uid) {
  return doc(db, 'users', uid, 'private', 'kitWorkspace');
}

export function canKitCloudSync() {
  return isFirebaseConfigured && Boolean(db);
}

function metaKey(uid) {
  return `${SYNC_PREFIX}${uid}`;
}

function readLocalMeta(uid) {
  try {
    return JSON.parse(localStorage.getItem(metaKey(uid)) || '{}');
  } catch {
    return {};
  }
}

function writeLocalMeta(uid, meta) {
  try {
    localStorage.setItem(metaKey(uid), JSON.stringify(meta || {}));
  } catch {
    /* ignore */
  }
}

/** Keys we mirror. Caller builds the payload blob. */
export function collectKitWorkspaceLocal(uid) {
  const out = { lines: {}, updatedAt: Date.now() };
  const prefixes = [
    'kit_msg_vars_',
    'mensajes_edits_',
    'kit_plan_',
    'kit_playbooks_',
    'kit_pedidos_',
    'kit_lista_',
    'kit_checklist_',
    'kit_checklist_venta_',
  ];

  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!prefixes.some((p) => key.startsWith(p))) continue;
      if (!key.includes(uid) && !key.includes('_local_')) continue;
      // Prefer keys for this uid
      if (!String(key).includes(uid)) continue;
      try {
        out.lines[key] = JSON.parse(localStorage.getItem(key));
      } catch {
        out.lines[key] = localStorage.getItem(key);
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

let syncTimer = null;

export function scheduleKitWorkspaceSync(uid) {
  if (!canKitCloudSync() || !uid) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    pushKitWorkspaceToCloud(uid).catch(() => {});
  }, 1000);
}

export async function pushKitWorkspaceToCloud(uid) {
  if (!canKitCloudSync() || !uid) return { ok: false };
  const payload = collectKitWorkspaceLocal(uid);
  try {
    await setDoc(
      workspaceRef(uid),
      {
        ...payload,
        updatedAt: serverTimestamp(),
        localUpdatedAt: payload.updatedAt,
      },
      { merge: true }
    );
    writeLocalMeta(uid, { lastPush: Date.now() });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function pullKitWorkspaceFromCloud(uid) {
  if (!canKitCloudSync() || !uid) return { ok: false, applied: 0 };
  try {
    const snap = await getDoc(workspaceRef(uid));
    if (!snap.exists()) {
      await pushKitWorkspaceToCloud(uid);
      return { ok: true, applied: 0, seeded: true };
    }
    const data = snap.data() || {};
    const cloudTime = data.localUpdatedAt || data.updatedAt?.toMillis?.() || 0;
    const meta = readLocalMeta(uid);
    const localTime = meta.lastLocalEdit || 0;

    // If local is newer and has edits, push instead of overwrite
    if (localTime && localTime > cloudTime + 2000) {
      await pushKitWorkspaceToCloud(uid);
      return { ok: true, applied: 0, pushed: true };
    }

    const lines = data.lines && typeof data.lines === 'object' ? data.lines : {};
    let applied = 0;
    for (const [key, value] of Object.entries(lines)) {
      if (!key || !String(key).includes(uid)) continue;
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      const current = localStorage.getItem(key);
      if (current === serialized) continue;
      // Don't clobber non-empty local with empty cloud
      if (serialized === '{}' || serialized === '[]' || serialized === 'null') {
        if (current && current !== '{}' && current !== '[]') continue;
      }
      localStorage.setItem(key, serialized);
      applied += 1;
    }
    writeLocalMeta(uid, { ...meta, lastPull: Date.now() });
    return { ok: true, applied };
  } catch {
    return { ok: false, applied: 0 };
  }
}

export function markKitLocalEdit(uid) {
  if (!uid) return;
  const meta = readLocalMeta(uid);
  writeLocalMeta(uid, { ...meta, lastLocalEdit: Date.now() });
  scheduleKitWorkspaceSync(uid);
}
