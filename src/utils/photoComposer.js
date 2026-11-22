/**
 * Photo booth composition: pure layout maths plus canvas drawing.
 * Everything runs in the browser. Photos are never uploaded anywhere.
 *
 * Overlay placement is stored as fractions of the photo so the live
 * preview and the captured image line up at any resolution:
 *   x, y  centre of the Pokémon (0–1 of width / height)
 *   size  Pokémon width as a fraction of the photo width
 */

export const MIN_SIZE = 0.2;
export const MAX_SIZE = 0.8;
export const DEFAULT_OVERLAY = Object.freeze({ x: 0.74, y: 0.62, size: 0.45 });
export const MAX_OUTPUT_DIMENSION = 1600;
export const BANNER_RATIO = 0.11; // banner height as a fraction of photo height

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Keeps an overlay inside sensible bounds (centre stays within the frame). */
export function clampOverlay({ x, y, size }) {
  return {
    x: clamp(Number.isFinite(x) ? x : DEFAULT_OVERLAY.x, 0, 1),
    y: clamp(Number.isFinite(y) ? y : DEFAULT_OVERLAY.y, 0, 1),
    size: clamp(Number.isFinite(size) ? size : DEFAULT_OVERLAY.size, MIN_SIZE, MAX_SIZE),
  };
}

/** Pixel rectangle for the Pokémon artwork on a photo of the given size. */
export function computeOverlayRect(overlay, photoWidth, photoHeight, artAspect = 1) {
  const { x, y, size } = clampOverlay(overlay);
  const width = size * photoWidth;
  const height = width / (artAspect > 0 ? artAspect : 1);
  return { left: x * photoWidth - width / 2, top: y * photoHeight - height / 2, width, height };
}

/** Scales a source size down so its longest side is at most `max`. */
export function fitWithin(width, height, max = MAX_OUTPUT_DIMENSION) {
  if (!(width > 0 && height > 0)) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Banner caption. Contains only the Pokémon name and match %, no answers. */
export function buildCaption(pokemonName, percent) {
  return { title: `Me & ${pokemonName}`, subtitle: `${percent}% match · PokéMatch` };
}

/** Loads an image that can be drawn onto a canvas without tainting it. */
export function loadImage(src, { crossOrigin = 'anonymous' } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = src;
  });
}

/**
 * Draws photo + Pokémon + banner onto a new canvas and returns a JPEG Blob.
 * `source` is a <video> (live camera) or an <img> (uploaded photo).
 */
export async function composePhoto({ source, sourceWidth, sourceHeight, mirror, artwork, overlay, caption, theme }) {
  const { width, height } = fitWithin(sourceWidth, sourceHeight);
  if (!width || !height) throw new Error('No photo to capture');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Photo (mirrored for selfies so it matches what the user saw).
  ctx.save();
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, 0, 0, width, height);
  ctx.restore();

  // 2. Pokémon artwork with a soft shadow.
  const rect = computeOverlayRect(overlay, width, height, artwork.naturalWidth / artwork.naturalHeight);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = Math.round(width * 0.02);
  ctx.shadowOffsetY = Math.round(width * 0.008);
  ctx.drawImage(artwork, rect.left, rect.top, rect.width, rect.height);
  ctx.restore();

  // 3. Banner.
  const bannerH = Math.round(height * BANNER_RATIO);
  const gradient = ctx.createLinearGradient(0, height - bannerH, 0, height);
  gradient.addColorStop(0, 'rgba(29, 43, 83, 0)');
  gradient.addColorStop(0.35, 'rgba(29, 43, 83, 0.78)');
  gradient.addColorStop(1, 'rgba(29, 43, 83, 0.92)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - bannerH * 1.6, width, bannerH * 1.6);

  const pad = Math.round(width * 0.035);
  const titleSize = Math.max(16, Math.round(bannerH * 0.42));
  const subSize = Math.max(11, Math.round(bannerH * 0.24));
  const font = "ui-rounded, 'Segoe UI', system-ui, sans-serif";
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${titleSize}px ${font}`;
  ctx.fillText(caption.title, pad, height - pad - subSize * 1.3);
  ctx.fillStyle = theme || '#ffcb05';
  ctx.fillRect(pad, height - pad - subSize * 1.05, Math.round(width * 0.06), Math.max(3, Math.round(subSize * 0.18)));
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = `700 ${subSize}px ${font}`;
  ctx.fillText(caption.subtitle, pad, height - pad + subSize * 0.2);

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create image'))), 'image/jpeg', 0.9);
    } catch (err) {
      reject(err); // SecurityError if the canvas were tainted
    }
  });
}

/** Turns camera errors into friendly messages. */
export function cameraErrorMessage(err) {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access was blocked. You can allow it in your browser settings, or upload a photo instead.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return "We couldn't find a camera on this device. You can upload a photo instead.";
    case 'NotReadableError':
      return 'Your camera is being used by another app. Close it and try again, or upload a photo instead.';
    case 'InsecureContext':
      return 'The camera only works on a secure (https) connection. You can upload a photo instead.';
    default:
      return "The camera couldn't start. You can try again or upload a photo instead.";
  }
}
