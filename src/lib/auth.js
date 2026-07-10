import { auth, isFirebaseConfigured } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { loadAdminAllowlist } from './admin-access.js';
import { createUserProfile, isAdminEmail, syncAdminFlag, touchUserActivity, updateUserProfile } from './user-profile.js';
import { consumeAccessCode, validateAccessCodeFromDb } from './access-codes-db.js';
import { purchaseFlagsFromSearch, resolveProductFlags } from './purchase-flags.js';
import { rememberActiveLine, resolveLineFromSearch, premiumStorageKey, LEGACY_PREMIUM_STORAGE_KEY } from './product-lines.js';
import { trackEvent } from './track.js';

function resolveRegisteredFrom(search, accessCode) {
  if (accessCode) return 'code';
  const params = new URLSearchParams(search || '');
  if (params.get('compra') === '1' || params.get('postres') === '1' || params.get('paletas') === '1') {
    const line = resolveLineFromSearch(search);
    if (line?.id === 'postres') return 'postres_lp';
    return 'paletas_lp';
  }
  return 'organic';
}

function setPremiumLocal(lineId, on) {
  const key = premiumStorageKey(lineId);
  if (on) localStorage.setItem(key, '1');
  else localStorage.removeItem(key);
  if (lineId === 'paletas') {
    if (on) localStorage.setItem(LEGACY_PREMIUM_STORAGE_KEY, '1');
    else localStorage.removeItem(LEGACY_PREMIUM_STORAGE_KEY);
  }
}

const DEMO_USERS_KEY = 'marmita_demo_users';
const DEMO_SESSION_KEY = 'marmita_demo_session';

function readDemoUsers() {
  return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]');
}

function writeDemoUsers(users) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function createDemoUser(name, email, password, flags = {}) {
  return {
    uid: `demo_${crypto.randomUUID()}`,
    email: email.trim().toLowerCase(),
    displayName: name.trim(),
    password,
    demo: true,
    hasKit: Boolean(flags.hasKit),
    hasPremium: Boolean(flags.hasPremium),
    hasPostres: Boolean(flags.hasPostres),
    hasPostresPremium: Boolean(flags.hasPostresPremium),
    isAdmin: isAdminEmail(email),
  };
}

function readDemoSessionRaw() {
  return localStorage.getItem(DEMO_SESSION_KEY) || sessionStorage.getItem(DEMO_SESSION_KEY);
}

function getDemoSessionUser() {
  const raw = readDemoSessionRaw();
  if (!raw) return null;
  const session = JSON.parse(raw);
  const users = readDemoUsers();
  return users.find((u) => u.uid === session.uid) || null;
}

function setDemoSession(user, rememberMe = true) {
  const payload = JSON.stringify({ uid: user.uid });
  if (rememberMe) {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    localStorage.setItem(DEMO_SESSION_KEY, payload);
    return;
  }
  localStorage.removeItem(DEMO_SESSION_KEY);
  sessionStorage.setItem(DEMO_SESSION_KEY, payload);
}

function clearDemoSession() {
  localStorage.removeItem(DEMO_SESSION_KEY);
  sessionStorage.removeItem(DEMO_SESSION_KEY);
}

function getRegisterAccessCode(options = {}) {
  const fromOptions = String(options.accessCode || '').trim();
  if (fromOptions) return fromOptions;
  return new URLSearchParams(window.location.search).get('code')?.trim() || '';
}

function grantsFromAccessCode(result) {
  const grants = {
    hasKit: false,
    hasPremium: false,
    hasPostres: false,
    hasPostresPremium: false,
  };
  if (!result?.valid) return grants;

  switch (result.type) {
    case 'kit':
      grants.hasKit = true;
      break;
    case 'premium':
      grants.hasPremium = true;
      break;
    case 'both':
      grants.hasKit = true;
      grants.hasPremium = true;
      break;
    case 'postres_kit':
      grants.hasPostres = true;
      break;
    case 'postres_premium':
      grants.hasPostresPremium = true;
      break;
    case 'postres_both':
      grants.hasPostres = true;
      grants.hasPostresPremium = true;
      break;
    default:
      grants.hasKit = true;
  }
  return grants;
}

async function applyAccessCodeToUser(uid, accessCode) {
  if (!accessCode) return null;

  const result = await validateAccessCodeFromDb(accessCode);
  if (!result.valid) return null;

  const grants = grantsFromAccessCode(result);
  await updateUserProfile(uid, grants);
  await consumeAccessCode(result);
  return grants;
}

/** OR-merge purchase flags onto an existing profile (2nd product buy). */
export async function applyPurchaseGrantsFromUrl(uid, search) {
  const flags = purchaseFlagsFromSearch(search);
  if (!flags) return null;

  const updates = {};
  for (const [key, value] of Object.entries(flags)) {
    if (value) updates[key] = true;
  }
  if (!Object.keys(updates).length) return null;

  if (isDemoMode()) {
    const users = readDemoUsers();
    const idx = users.findIndex((u) => u.uid === uid);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      writeDemoUsers(users);
    }
    return updates;
  }

  await updateUserProfile(uid, updates);
  return updates;
}

function rememberLineFromUrl(search) {
  const line = resolveLineFromSearch(search);
  if (line) rememberActiveLine(line.id);
}

export function isDemoMode() {
  return !isFirebaseConfigured;
}

export async function login(email, password, options = {}) {
  const rememberMe = options.rememberMe !== false;
  const search = options.search ?? (typeof window !== 'undefined' ? window.location.search : '');
  rememberLineFromUrl(search);

  if (isDemoMode()) {
    const users = readDemoUsers();
    const user = users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    setDemoSession(user, rememberMe);
    await applyPurchaseGrantsFromUrl(user.uid, search);
    const refreshed = readDemoUsers().find((u) => u.uid === user.uid) || user;
    setDemoSession(refreshed, rememberMe);
    if (refreshed.hasPremium) setPremiumLocal('paletas', true);
    if (refreshed.hasPostresPremium) setPremiumLocal('postres', true);
    const line = resolveLineFromSearch(search);
    trackEvent('login', { page: 'login', line: line?.id || undefined, uid: refreshed.uid });
    return toPublicUser(refreshed);
  }

  const { requireFirebase } = await import('./firebase.js');
  const {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
  } = await import('firebase/auth');
  const auth = requireFirebase();
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  await loadAdminAllowlist();
  await syncAdminFlag(result.user.uid, result.user.email);
  await applyPurchaseGrantsFromUrl(result.user.uid, search);
  const line = resolveLineFromSearch(search);
  await touchUserActivity(result.user.uid, line?.id ? { lastActiveLine: line.id } : {});
  trackEvent('login', { page: 'login', line: line?.id || undefined, uid: result.user.uid });
  const grants = purchaseFlagsFromSearch(search);
  if (grants?.hasPremium) setPremiumLocal('paletas', true);
  if (grants?.hasPostresPremium) setPremiumLocal('postres', true);
  return result.user;
}

export async function register(name, email, password, options = {}) {
  const search = options.search ?? (typeof window !== 'undefined' ? window.location.search : '');
  rememberLineFromUrl(search);
  const flags = resolveProductFlags(options, search);
  const admin = isAdminEmail(email);
  const accessCode = getRegisterAccessCode(options);

  if (isDemoMode()) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = readDemoUsers();
    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error('Este correo ya está registrado.');
    }
    const user = createDemoUser(name, normalizedEmail, password, flags);
    if (admin) {
      user.hasKit = true;
      user.isAdmin = true;
    }
    if (accessCode) {
      const result = await validateAccessCodeFromDb(accessCode);
      const grants = grantsFromAccessCode(result);
      if (grants.hasKit) user.hasKit = true;
      if (grants.hasPremium) user.hasPremium = true;
      if (grants.hasPostres) user.hasPostres = true;
      if (grants.hasPostresPremium) user.hasPostresPremium = true;
    }
    users.push(user);
    writeDemoUsers(users);
    setDemoSession(user);
    if (user.hasPremium) setPremiumLocal('paletas', true);
    if (user.hasPostresPremium) setPremiumLocal('postres', true);
    const line = resolveLineFromSearch(search);
    trackEvent('register', { page: 'cadastrar', line: line?.id || undefined, uid: user.uid });
    return toPublicUser(user);
  }

  const { requireFirebase } = await import('./firebase.js');
  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const auth = requireFirebase();
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(result.user, { displayName: name.trim() });

  const line = resolveLineFromSearch(search);
  const registeredFrom = resolveRegisteredFrom(search, accessCode);

  await createUserProfile(result.user.uid, {
    email: result.user.email,
    displayName: name.trim(),
    ...flags,
    registeredFrom,
    registeredLine: line?.id || null,
  });
  await syncAdminFlag(result.user.uid, result.user.email);

  const codeGrants = await applyAccessCodeToUser(result.user.uid, accessCode);
  if (codeGrants?.hasPremium || flags.hasPremium) setPremiumLocal('paletas', true);
  if (codeGrants?.hasPostresPremium || flags.hasPostresPremium) setPremiumLocal('postres', true);

  await touchUserActivity(result.user.uid, line?.id ? { lastActiveLine: line.id } : {});
  trackEvent('register', {
    page: 'cadastrar',
    line: line?.id || undefined,
    uid: result.user.uid,
  });

  return result.user;
}

export async function resetPassword(email) {
  if (isDemoMode()) {
    throw new Error('Recuperación de contraseña disponible solo con Firebase configurado.');
  }

  const { requireFirebase } = await import('./firebase.js');
  const { sendPasswordResetEmail } = await import('firebase/auth');
  const auth = requireFirebase();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logout() {
  if (isDemoMode()) {
    clearDemoSession();
    return;
  }

  const { requireFirebase } = await import('./firebase.js');
  const { signOut } = await import('firebase/auth');
  const auth = requireFirebase();
  await signOut(auth);
}

export function watchAuth(callback) {
  if (isDemoMode()) {
    callback(getDemoSessionUser() ? toPublicUser(getDemoSessionUser()) : null);
    return () => {};
  }

  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export function guardAuthPage() {
  watchAuth((user) => {
    if (user) {
      redirectIfAuthenticated(user);
      return;
    }
    document.body.classList.remove('auth-checking');
    document.body.classList.add('auth-resolved');
  });
}

export function redirectIfAuthenticated(user, target) {
  if (!user) return;
  const params = new URLSearchParams(window.location.search);
  const line = resolveLineFromSearch(window.location.search);
  if (line) rememberActiveLine(line.id);

  if (params.get('compra') === '1') {
    // Existing session hitting purchase URL — merge grants then go to app.
    applyPurchaseGrantsFromUrl(user.uid, window.location.search).finally(() => {
      const next = new URLSearchParams();
      next.set('compra', '1');
      if (params.get('premium') === '1') next.set('premium', '1');
      if (params.get('postres') === '1') next.set('postres', '1');
      if (params.get('postres_premium') === '1') next.set('postres_premium', '1');
      if (params.get('paletas') === '1') next.set('paletas', '1');
      if (params.get('donuts') === '1') next.set('donuts', '1');
      if (line?.id || params.get('line')) next.set('line', line?.id || params.get('line'));
      window.location.replace(`/app?${next.toString()}`);
    });
    return;
  }
  const next = params.get('next');
  const dest = next && next.startsWith('/') ? next : target || '/app';
  const sep = dest.includes('?') ? '&' : '?';
  window.location.replace(line?.id && !dest.includes('line=') ? `${dest}${sep}line=${line.id}` : dest);
}

export function redirectIfGuest(user, target = '/login') {
  if (!user) {
    const current = window.location.pathname + window.location.search;
    const params = new URLSearchParams();
    params.set('next', current);
    const line = resolveLineFromSearch(window.location.search);
    if (line) {
      rememberActiveLine(line.id);
      params.set('line', line.id);
    }
    window.location.href = `${target}?${params.toString()}`;
  }
}

export function getUserLabel(user) {
  if (!user) return '';
  return user.displayName || user.email?.split('@')[0] || 'Usuario';
}

function toPublicUser(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    demo: Boolean(user.demo),
  };
}
