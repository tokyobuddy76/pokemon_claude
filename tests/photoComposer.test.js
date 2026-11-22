import { describe, it, expect } from 'vitest';
import {
  DEFAULT_OVERLAY,
  MAX_SIZE,
  MIN_SIZE,
  buildCaption,
  cameraErrorMessage,
  clampOverlay,
  computeOverlayRect,
  fitWithin,
} from '../src/utils/photoComposer.js';

describe('photo booth layout', () => {
  it('keeps the overlay centre inside the frame and the size within limits', () => {
    expect(clampOverlay({ x: -1, y: 2, size: 5 })).toEqual({ x: 0, y: 1, size: MAX_SIZE });
    expect(clampOverlay({ x: 0.5, y: 0.5, size: 0 })).toEqual({ x: 0.5, y: 0.5, size: MIN_SIZE });
    expect(clampOverlay({ x: NaN, y: undefined, size: null })).toEqual({ ...DEFAULT_OVERLAY });
  });

  it('maps fractional placement to the same pixels at any resolution', () => {
    const overlay = { x: 0.5, y: 0.5, size: 0.4 };
    const small = computeOverlayRect(overlay, 640, 480, 1);
    const large = computeOverlayRect(overlay, 1280, 960, 1);
    expect(small).toEqual({ left: 192, top: 112, width: 256, height: 256 });
    for (const key of ['left', 'top', 'width', 'height']) expect(large[key]).toBe(small[key] * 2);
  });

  it('respects the artwork aspect ratio', () => {
    const rect = computeOverlayRect({ x: 0.5, y: 0.5, size: 0.5 }, 1000, 1000, 2);
    expect(rect.width).toBe(500);
    expect(rect.height).toBe(250);
  });

  it('scales large photos down to the output limit without upscaling small ones', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(0, 600)).toEqual({ width: 0, height: 0 });
  });

  it('caption contains only the Pokémon name and match percentage', () => {
    expect(buildCaption('Pikachu', 87)).toEqual({ title: 'Me & Pikachu', subtitle: '87% match · PokéMatch' });
  });

  it('gives friendly messages for camera errors, with an upload fallback', () => {
    for (const name of ['NotAllowedError', 'NotFoundError', 'NotReadableError', 'InsecureContext', 'Weird']) {
      const msg = cameraErrorMessage({ name });
      expect(msg.length).toBeGreaterThan(20);
      expect(msg).not.toMatch(/undefined/);
    }
    expect(cameraErrorMessage({ name: 'NotAllowedError' })).toMatch(/upload/i);
  });
});
