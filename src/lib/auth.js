import { isFirebaseConfigured } from './firebase.js';
import { validateAccessCodeFromDb, consumeAccessCode } from './access-codes-db.js';
import { createUserProfile, syncAdminFlag } from './user-profile.js';

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
  };
}

function getDemoSessionUser() {
  const raw = localStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return null;
  const session = JSON.parse(raw);
  const users = readDemoUsers();
  return users.find((u) => u.uid === session.uid) || null;
}

function setDemoSession(user) {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ uid: user.uid }));
}

function clearDemoSession() {
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export function isDemoMode() {
  return !isFirebaseConfigured;
}

export async function validateAccessCode(code) {
  const result = await validateAccessCodeFromDb(code);
  return result.valid;
}

export async function login(email, password) {
  if (isDemoMode()) {
    const users = readDemoUsers();
    const user = users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    setDemoSession(user);
    return toPublicUser(user);
  }

  const { requireFirebase } = await import('./firebase.js');
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const auth = requireFirebase();
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function register(name, email, password, accessCode, options = {}) {
  const codeResult = await validateAccessCodeFromDb(accessCode);
  if (!codeResult.valid) {
    throw new Error(
      codeResult.reason || 'Código de acceso inválido. Usa el código enviado después de la compra.'
    );
  }

  const urlPremium = new URLSearchParams(window.location.search).get('premium') === '1';
  const hasPremium =
    Boolean(options.hasPremium) ||
    urlPremium ||
    codeResult.hasPremium ||
    codeResult.type === 'premium' ||
    codeResult.type === 'both';

  if (isDemoMode()) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = readDemoUsers();
    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error('Este correo ya está registrado.');
    }
    const user = createDemoUser(name, normalizedEmail, password);
    user.hasPremium = hasPremium;
    users.push(user);
    writeDemoUsers(users);
    setDemoSession(user);
    if (hasPremium) localStorage.setItem('paletas_premium', '1');
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
    accessCodeUsed: accessCode,
  });
  await consumeAccessCode(codeResult);
  await syncAdminFlag(result.user.uid, result.user.email);

  if (hasPremium) localStorage.setItem('paletas_premium', '1');

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
    window.location.href = params.get('premium') === '1' ? '/membros?compra=1' : '/membros?compra=1';
    return;
  }
  const next = params.get('next');
  window.location.href = next && next.startsWith('/') ? next : target || '/membros';
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
