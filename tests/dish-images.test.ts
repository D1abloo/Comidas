import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_DISH_IMAGE_BYTES,
  detectDishImageExtension,
} from '../apps/web/src/server/dish-images.ts';

test('detecta imágenes permitidas por su firma binaria', () => {
  assert.equal(detectDishImageExtension(Uint8Array.from([0xff, 0xd8, 0xff, 0x00])), 'jpg');
  assert.equal(
    detectDishImageExtension(
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    'png',
  );
  assert.equal(
    detectDishImageExtension(
      Uint8Array.from([
        0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
      ]),
    ),
    'webp',
  );
});

test('rechaza extensiones falsas y mantiene un límite de carga razonable', () => {
  assert.equal(detectDishImageExtension(new TextEncoder().encode('<svg></svg>')), null);
  assert.equal(detectDishImageExtension(Uint8Array.from([0x47, 0x49, 0x46])), null);
  assert.equal(MAX_DISH_IMAGE_BYTES, 2_000_000);
});
