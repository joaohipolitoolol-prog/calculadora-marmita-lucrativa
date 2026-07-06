import { isFirebaseConfigured } from './firebase.js';

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

export function validateAccessCode(code) {
  const expected = import.meta.env.VITE_ACCESS_CODE || 'marmita27';
  return String(code).trim().toLowerCase() === String(expected).trim().toLowerCase();
}

export async function login(email, password) {
  if (isDemoMode()) {
    const users = readDemoUsers();
    const user = users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('E-mail ou senha incorretos.');
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

export async function register(name, email, password, accessCode) {
  if (!validateAccessCode(accessCode)) {
    throw new Error('Código de acesso inválido. Use o código enviado após a compra.');
  }

  if (isDemoMode()) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = readDemoUsers();
    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error('Este e-mail já está cadastrado.');
    }
    const user = createDemoUser(name, normalizedEmail, password);
    users.push(user);
    writeDemoUsers(users);
    setDemoSession(user);
    return toPublicUser(user);
  }

  const { requireFirebase } = await import('./firebase.js');
  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const auth = requireFirebase();
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(result.user, { displayName: name.trim() });
  return result.user;
}

export async function resetPassword(email) {
  if (isDemoMode()) {
    throw new Error('Recuperação de senha disponível apenas com Firebase configurado.');
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
  const next = params.get('next');
  window.location.href = next || target || '/membros';
}

export function redirectIfGuest(user, target = '/login') {
  if (!user) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${target}?next=${next}`;
  }
}

export function getUserLabel(user) {
  if (!user) return '';
  return user.displayName || user.email?.split('@')[0] || 'Usuário';
}

export const DEMO_GUEST = {
  name: 'Visitante Demo',
  email: 'demo@marmitalucrativa.app',
  password: 'demo1234',
};

export async function enterDemo() {
  if (!isDemoMode()) {
    throw new Error('Demo disponível apenas enquanto Firebase não está configurado.');
  }

  const users = readDemoUsers();
  let user = users.find((u) => u.email === DEMO_GUEST.email);

  if (!user) {
    user = createDemoUser(DEMO_GUEST.name, DEMO_GUEST.email, DEMO_GUEST.password);
    user.isGuestDemo = true;
    users.push(user);
    writeDemoUsers(users);
  }

  setDemoSession(user);
  sessionStorage.setItem('paletas_demo_welcome', '1');
  return toPublicUser(user);
}

function toPublicUser(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    demo: Boolean(user.demo),
  };
}
