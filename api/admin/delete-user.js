import { verifyAdminRequest, getFirebaseAdmin } from '../../server/lib/firebase-admin.js';

async function deleteCollection(firestore, collectionRef, batchSize = 100) {
  const snap = await collectionRef.limit(batchSize).get();
  if (snap.empty) return;

  const batch = firestore.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  if (snap.size >= batchSize) {
    await deleteCollection(firestore, collectionRef, batchSize);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const adminUser = await verifyAdminRequest(req);
    const { uid } = req.body || {};

    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'uid es obligatorio' });
    }

    if (uid === adminUser.uid) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    const firebaseAdmin = getFirebaseAdmin();
    if (!firebaseAdmin) {
      return res.status(503).json({ error: 'Firebase Admin no configurado' });
    }

    const firestore = firebaseAdmin.firestore();
    const profileSnap = await firestore.doc(`users/${uid}`).get();

    if (!profileSnap.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (profileSnap.data()?.isAdmin) {
      return res.status(403).json({ error: 'No se puede eliminar una cuenta admin' });
    }

    await deleteCollection(firestore, firestore.collection(`users/${uid}/scenarios`));
    await deleteCollection(firestore, firestore.collection(`users/${uid}/private`));
    await firestore.doc(`users/${uid}`).delete();

    try {
      await firebaseAdmin.auth().deleteUser(uid);
    } catch (authError) {
      if (authError?.code !== 'auth/user-not-found') {
        throw authError;
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return res.status(status).json({ error: message });
  }
}
