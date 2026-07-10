import { canUseStorage, storage } from './firebase.js';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const MAX_DATA_URL = 70_000;

/**
 * Compress image File to JPEG Blob (and optional data URL fallback).
 */
export function compressImageToBlob(file, { maxSide = 720, quality = 0.78 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('invalid_image'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('image_too_large'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      const scale = Math.min(1, maxSide / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let q = quality;
      const tryEncode = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('invalid_image'));
              return;
            }
            if (blob.size > 900_000 && q > 0.45) {
              q -= 0.1;
              tryEncode();
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          q
        );
      };
      tryEncode();
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('invalid_image'));
    };
    img.src = objectUrl;
  });
}

/** Legacy helper — data URL for offline/demo only */
export async function compressImageFile(file, opts = {}) {
  const blob = await compressImageToBlob(file, opts);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (dataUrl.length > MAX_DATA_URL) {
        reject(new Error('image_too_large'));
        return;
      }
      resolve(dataUrl);
    };
    reader.onerror = () => reject(new Error('invalid_image'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload menu image to Storage when available; otherwise return data URL.
 * kind: 'cover' | 'logo' | 'item'
 */
export async function uploadMenuImage(uid, file, { kind, itemId = '', maxSide = 720 } = {}) {
  const blob = await compressImageToBlob(file, { maxSide });

  if (canUseStorage() && uid) {
    const path =
      kind === 'item'
        ? `menus/${uid}/items/${itemId || Date.now()}.jpg`
        : `menus/${uid}/${kind}.jpg`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      cacheControl: 'public,max-age=31536000',
    });
    return getDownloadURL(storageRef);
  }

  // Offline / demo fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (dataUrl.length > MAX_DATA_URL) {
        reject(new Error('image_too_large'));
        return;
      }
      resolve(dataUrl);
    };
    reader.onerror = () => reject(new Error('invalid_image'));
    reader.readAsDataURL(blob);
  });
}
