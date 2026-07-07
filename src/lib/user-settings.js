import { isFirebaseConfigured } from './firebase.js';
import { updateUserProfile } from './user-profile.js';

export async function saveDisplayName(user, name) {
  const trimmed = String(name || '').trim();
  if (!trimmed || !user?.uid) return;

  if (!isFirebaseConfigured || user.demo) {
    localStorage.setItem(`paletas_display_name_${user.uid}`, trimmed);
    return trimmed;
  }

  const { requireFirebase } = await import('./firebase.js');
  const { updateProfile } = await import('firebase/auth');
  const auth = requireFirebase();
  if (!auth.currentUser) return trimmed;

  await updateProfile(auth.currentUser, { displayName: trimmed });
  await updateUserProfile(auth.currentUser.uid, { displayName: trimmed });
  return trimmed;
}

export function getLocalDisplayName(uid) {
  return localStorage.getItem(`paletas_display_name_${uid}`) || '';
}
