import { verifyAdminRequest, getFirebaseAdmin, FieldValue } from '../lib/firebase-admin.js';

const PRODUCT_FIELDS = ['hasKit', 'hasPremium', 'hasPostres', 'hasPostresPremium', 'hasMinipostres'];

function hasPasswordProvider(authUser) {
  return (authUser?.providerData || []).some((p) => p.providerId === 'password');
}

function serializeTimestamp(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate().toISOString();
  if (value._seconds) return new Date(value._seconds * 1000).toISOString();
  return value;
}

function normalizePremiumPending(raw) {
  const pending = raw && typeof raw === 'object' ? raw : {};
  return {
    paletas: Boolean(pending.paletas),
    postres: Boolean(pending.postres),
  };
}

function mergeUser(authUser, profile) {
  const base = profile
    ? {
        id: profile.id || authUser?.uid,
        ...profile,
        createdAt: serializeTimestamp(profile.createdAt),
        updatedAt: serializeTimestamp(profile.updatedAt),
        lastLoginAt: serializeTimestamp(profile.lastLoginAt),
        premiumPending: normalizePremiumPending(profile.premiumPending),
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
      hasMinipostres: Boolean(base?.hasMinipostres),
      hasMinipostresPremium: Boolean(base?.hasMinipostresPremium),
      isAdmin: Boolean(base?.isAdmin),
      registeredFrom: base?.registeredFrom || null,
      registeredLine: base?.registeredLine || null,
      lastActiveLine: base?.lastActiveLine || null,
      premiumPending: base?.premiumPending || { paletas: false, postres: false },
      needsPasswordSetup: Boolean(base?.needsPasswordSetup) || !hasPasswordProvider(authUser),
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
    premiumPending: base?.premiumPending || { paletas: false, postres: false },
    needsPasswordSetup: Boolean(base?.needsPasswordSetup),
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

function productFlagsFromBody(products = {}) {
  return {
    hasKit: Boolean(products.paletas_kit),
    hasPremium: Boolean(products.paletas_premium),
    hasPostres: Boolean(products.postres_kit),
    hasPostresPremium: Boolean(products.postres_premium),
    hasMinipostres: Boolean(products.minipostres_kit),
    hasMinipostresPremium: Boolean(products.minipostres_premium),
  };
}

/**
 * Create or link a user by email.
 * Password optional: empty = no password (buyer can reset later) or link existing Auth account.
 */
async function createUser(firebaseAdmin, body) {
  const { email, password, displayName, products = {}, registeredFrom = 'manual' } = body || {};
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();
  const name = String(displayName || '').trim();
  const rawPassword = password == null ? '' : String(password);
  const wantsPassword = rawPassword.length > 0;

  if (!normalizedEmail) {
    throw Object.assign(new Error('email es obligatorio'), { status: 400 });
  }
  if (wantsPassword && rawPassword.length < 6) {
    throw Object.assign(new Error('La contraseña debe tener al menos 6 caracteres'), {
      status: 400,
    });
  }

  const auth = firebaseAdmin.auth();
  const firestore = firebaseAdmin.firestore();
  const flags = productFlagsFromBody(products);

  let authUser = null;
  let linkedExisting = false;
  let createdAuth = false;

  try {
    authUser = await auth.getUserByEmail(normalizedEmail);
    linkedExisting = true;
  } catch (err) {
    if (err?.code !== 'auth/user-not-found') throw err;
  }

  if (authUser) {
    if (wantsPassword) {
      await auth.updateUser(authUser.uid, {
        password: rawPassword,
        displayName: name || authUser.displayName || undefined,
      });
      authUser = await auth.getUser(authUser.uid);
    } else if (name && name !== authUser.displayName) {
      await auth.updateUser(authUser.uid, { displayName: name });
      authUser = await auth.getUser(authUser.uid);
    }
  } else {
    const createPayload = {
      email: normalizedEmail,
      displayName: name || undefined,
    };
    if (wantsPassword) createPayload.password = rawPassword;
    authUser = await auth.createUser(createPayload);
    createdAuth = true;
  }

  const ref = firestore.doc(`users/${authUser.uid}`);
  const snap = await ref.get();
  const prev = snap.exists ? snap.data() || {} : {};

  const needsPasswordSetup =
    !wantsPassword && !hasPasswordProvider(authUser)
      ? true
      : wantsPassword
        ? false
        : Boolean(prev.needsPasswordSetup);

  const profile = {
    email: authUser.email || normalizedEmail,
    displayName: name || prev.displayName || authUser.displayName || '',
    registeredFrom: prev.registeredFrom || registeredFrom,
    isAdmin: Boolean(prev.isAdmin),
    // OR-merge grants so re-adding never strips access
    hasKit: Boolean(prev.hasKit) || flags.hasKit,
    hasPremium: Boolean(prev.hasPremium) || flags.hasPremium,
    hasPostres: Boolean(prev.hasPostres) || flags.hasPostres,
    hasPostresPremium: Boolean(prev.hasPostresPremium) || flags.hasPostresPremium,
    hasMinipostres: Boolean(prev.hasMinipostres) || flags.hasMinipostres,
    hasMinipostresPremium: Boolean(prev.hasMinipostresPremium) || flags.hasMinipostresPremium,
    premiumPending: normalizePremiumPending(prev.premiumPending),
    needsPasswordSetup,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!snap.exists) {
    profile.createdAt = FieldValue.serverTimestamp();
  }

  if (
    flags.hasKit ||
    flags.hasPremium ||
    flags.hasPostres ||
    flags.hasPostresPremium ||
    flags.hasMinipostres ||
    flags.hasMinipostresPremium
  ) {
    profile.lastGrantSource = linkedExisting ? 'admin_link' : 'admin_manual';
    profile.lastGrantAt = new Date().toISOString();
  }

  await ref.set(profile, { merge: true });

  return {
    uid: authUser.uid,
    email: authUser.email || normalizedEmail,
    linkedExisting,
    createdAuth,
    needsPasswordSetup,
  };
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
          premiumPending: { paletas: false, postres: false },
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
