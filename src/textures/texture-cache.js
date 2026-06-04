/** @type {Map<string, Promise<ImageData>>} */
const pending = new Map();

/** @type {Map<string, ImageData>} */
const loaded = new Map();

/**
 * Load an image from src/assets/images and return ImageData (cached by filename).
 * @param {string} filename  e.g. "cats1.jpg"
 * @returns {Promise<ImageData>}
 */
export function loadTextureImage(filename) {
  if (loaded.has(filename)) {
    return Promise.resolve(loaded.get(filename));
  }

  if (pending.has(filename)) {
    return pending.get(filename);
  }

  const promise = new Promise((resolve, reject) => {
    const url = new URL(`../assets/images/${filename}`, import.meta.url).href;
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      loaded.set(filename, imageData);
      pending.delete(filename);
      resolve(imageData);
    };

    img.onerror = () => {
      pending.delete(filename);
      reject(new Error(`Failed to load texture: ${filename}`));
    };

    img.src = url;
  });

  pending.set(filename, promise);
  return promise;
}

/** Preload a list of texture filenames in parallel. */
export function preloadTextures(filenames) {
  return Promise.all(filenames.map(loadTextureImage));
}

/** Returns cached ImageData if already loaded, otherwise null. */
export function getTexture(filename) {
  return loaded.get(filename) ?? null;
}
