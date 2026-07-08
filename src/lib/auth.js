import { isFirebaseConfigured } from './firebase.js';
import { createUserProfile, isAdminEmail, syncAdminFlag, updateUserProfile } from './user-profile.js';
import { consumeAccessCode, validateAccessCodeFromDb } from './access-codes-db.js';

const DEMO_USERS_KEY = 'marmita_demo_users';
const DEMO_SESSION_KEY = 'marmita_demo_session';

function readDemoUsers() {
  return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]');
}

function writeDemoUsers(users) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function createDemoUser(name, email, password) {
  return {
    uid: `demo_${crypto.randomUUID()}`,
    email: email.trim().toLowerCase(),
    displayName: name.trim(),
    password,
    demo: true,
    hasKit: false,
    hasPremium: false,
    isAdmin: isAdminEmail(email),
  };
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

export function isDemoMode() {
  return !isFirebaseConfigured;
}

export async function login(email, password, options = {}) {
  const rememberMe = options.rememberMe !== false;

  if (isDemoMode()) {
    const users = readDemoUsers();
    const user = users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    setDemoSession(user, rememberMe);
    return toPublicUser(user);
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
  return result.user;
}

export async function register(name, email, password, options = {}) {
  const urlPremium = new URLSearchParams(window.location.search).get('premium') === '1';
  const hasPremium = Boolean(options.hasPremium) || urlPremium;
  const admin = isAdminEmail(email);
  const accessCode = getRegisterAccessCode(options);

  if (isDemoMode()) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = readDemoUsers();
    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error('Este correo ya está registrado.');
    }
    const user = createDemoUser(name, normalizedEmail, password);
    user.hasPremium = hasPremium;
    if (admin) {
      user.hasKit = true;
      user.isAdmin = true;
    }
    if (accessCode) {
      const result = await validateAccessCodeFromDb(accessCode);
      const grants = grantsFromAccessCode(result);
      if (grants.hasKit) user.hasKit = true;
      if (grants.hasPremium) user.hasPremium = true;
    }
    users.push(user);
    writeDemoUsers(users);
    setDemoSession(user);
    if (user.hasPremium) localStorage.setItem('paletas_premium', '1');
    return toPublicUser(user);
  }

  const { requireFirebase } = await import('./firebase.js');
  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const auth = requireFirebase();
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(result.user, { displayName: name.trim() });

  await createUserProfile(result.user.uid, {
    email: result.user.email,
    displayName: name.trim(),
    hasPremium,
  });
  await syncAdminFlag(result.user.uid, result.user.email);

  const codeGrants = await applyAccessCodeToUser(result.user.uid, accessCode);
  if (codeGrants?.hasPremium || hasPremium) localStorage.setItem('paletas_premium', '1');

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

  import('./firebase.js').then(({ auth, isFirebaseConfigured }) => {
    if (!isFirebaseConfigured || !auth) {
      callback(null);
      return;
    }
    import('firebase/auth').then(({ onAuthStateChanged }) => {
      onAuthStateChanged(auth, callback);
    });
  });
}

export function redirectIfAuthenticated(user, target) {
  if (!user) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('compra') === '1') {
    const premium = params.get('premium') === '1';
    window.location.href = premium ? '/app?compra=1&premium=1' : '/app?compra=1';
    return;
  }
  const next = params.get('next');
  window.location.href = next && next.startsWith('/') ? next : target || '/app';
}

export function redirectIfGuest(user, target = '/login') {
  if (!user) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${target}?next=${next}`;
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
