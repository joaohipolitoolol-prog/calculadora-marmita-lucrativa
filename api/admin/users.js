import { verifyAdminRequest, getFirebaseAdmin, FieldValue } from '../lib/firebase-admin.js';

const PRODUCT_FIELDS = ['hasKit', 'hasPremium', 'hasPostres', 'hasPostresPremium'];

function serializeTimestamp(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate().toISOString();
  if (value._seconds) return new Date(value._seconds * 1000).toISOString();
  return value;
}

function mergeUser(authUser, profile) {
  const base = profile
    ? {
        id: profile.id || authUser?.uid,
        ...profile,
        createdAt: serializeTimestamp(profile.createdAt),
        updatedAt: serializeTimestamp(profile.updatedAt),
        lastLoginAt: serializeTimestamp(profile.lastLoginAt),
      }
    : null;

  if (authUser) {
    return {
      id: authUser.uid,
      email: base?.email || authUser.email || '',
      displayName: base?.displayName || authUser.displayName || '',
      hasKit: Boolean(base?.hasKit),
      hasPremium: Boolean(base?.hasPremium),
      hasPostres: Boolean(base?.hasPostres),
      hasPostresPremium: Boolean(base?.hasPostresPremium),
      isAdmin: Boolean(base?.isAdmin),
      registeredFrom: base?.registeredFrom || null,
      createdAt: base?.createdAt || authUser.metadata?.creationTime || null,
      updatedAt: base?.updatedAt || null,
      lastLoginAt: base?.lastLoginAt || authUser.metadata?.lastSignInTime || null,
      emailVerified: Boolean(authUser.emailVerified),
      disabled: Boolean(authUser.disabled),
      missingProfile: !profile,
      authOnly: !profile,
    };
  }

  return {
    ...base,
    missingProfile: false,
    authOnly: false,
  };
}

async function listMergedUsers(firebaseAdmin) {
  const firestore = firebaseAdmin.firestore();
  const auth = firebaseAdmin.auth();

  const profileSnap = await firestore.collection('users').get();
  const profiles = new Map(
    profileSnap.docs.map((doc) => [doc.id, { id: doc.id, ...doc.data() }])
  );

  const authUsers = [];
  let pageToken;
  do {
    const result = await auth.listUsers(1000, pageToken);
    authUsers.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);

  const merged = new Map();

  for (const authUser of authUsers) {
    merged.set(authUser.uid, mergeUser(authUser, profiles.get(authUser.uid)));
    profiles.delete(authUser.uid);
  }

  for (const [uid, profile] of profiles) {
    merged.set(uid, mergeUser(null, profile));
  }

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

async function createUser(firebaseAdmin, body) {
  const { email, password, displayName, products = {}, registeredFrom = 'manual' } = body || {};

  if (!email || !password) {
    throw Object.assign(new Error('email y password son obligatorios'), { status: 400 });
  }
  if (String(password).length < 6) {
    throw Object.assign(new Error('La contraseña debe tener al menos 6 caracteres'), {
      status: 400,
    });
  }

  const authUser = await firebaseAdmin.auth().createUser({
    email: String(email).trim().toLowerCase(),
    password: String(password),
    displayName: String(displayName || '').trim() || undefined,
  });

  const profile = {
    email: authUser.email,
    displayName: String(displayName || '').trim(),
    registeredFrom,
    isAdmin: false,
    hasKit: Boolean(products.paletas_kit),
    hasPremium: Boolean(products.paletas_premium),
    hasPostres: Boolean(products.postres_kit),
    hasPostresPremium: Boolean(products.postres_premium),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await firebaseAdmin.firestore().doc(`users/${authUser.uid}`).set(profile, { merge: true });

  return { uid: authUser.uid, email: authUser.email };
}

async function syncMissingProfiles(firebaseAdmin) {
  const firestore = firebaseAdmin.firestore();
  const auth = firebaseAdmin.auth();
  let created = 0;
  let pageToken;

  do {
    const result = await auth.listUsers(1000, pageToken);
    for (const authUser of result.users) {
      const ref = firestore.doc(`users/${authUser.uid}`);
      const snap = await ref.get();
      if (snap.exists) continue;

      await ref.set(
        {
          email: (authUser.email || '').toLowerCase(),
          displayName: authUser.displayName || '',
          hasKit: false,
          hasPremium: false,
          hasPostres: false,
          hasPostresPremium: false,
          isAdmin: false,
          registeredFrom: 'sync',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      created += 1;
    }
    pageToken = result.pageToken;
  } while (pageToken);

  return { created };
}

export default async function handler(req, res) {
  try {
    await verifyAdminRequest(req);
    const firebaseAdmin = getFirebaseAdmin();
    if (!firebaseAdmin) {
      return res.status(503).json({ error: 'Firebase Admin no configurado' });
    }

    if (req.method === 'GET') {
      const users = await listMergedUsers(firebaseAdmin);
      const orphans = users.filter((user) => user.missingProfile).length;
      return res.status(200).json({ users, orphans });
    }

    if (req.method === 'POST') {
      const action = req.body?.action;

      if (action === 'sync') {
        const result = await syncMissingProfiles(firebaseAdmin);
        const users = await listMergedUsers(firebaseAdmin);
        return res.status(200).json({ ...result, users, orphans: 0 });
      }

      const result = await createUser(firebaseAdmin, req.body);
      const users = await listMergedUsers(firebaseAdmin);
      return res.status(200).json({ ...result, users });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status =
      error.status ||
      (message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500);
    return res.status(status).json({ error: message });
  }
}
