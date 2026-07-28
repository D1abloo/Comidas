import assert from 'node:assert/strict';
import test from 'node:test';
import {
  catalogSlug,
  parseDishPatch,
  parseMenuSectionPatch,
  uniqueCatalogSlug,
} from '../apps/web/src/server/catalog-input.ts';

test('genera slugs estables y evita colisiones', () => {
  assert.equal(catalogSlug('  Cazuela de León  '), 'cazuela-de-leon');
  assert.equal(uniqueCatalogSlug('Pizza', ['pizza', 'pizza-2']), 'pizza-3');
  assert.equal(uniqueCatalogSlug('Ramen', ['pizza']), 'ramen');
});

test('valida los límites y todas las imágenes del catálogo', () => {
  assert.throws(
    () => parseDishPatch({ name: 'Plato', price_cents: -1 }, true),
    /invalid_number/,
  );
  assert.throws(
    () =>
      parseDishPatch({
        name: 'Plato',
        images: ['/carta/plato.jpg', 'javascript:alert(1)'],
      }, true),
    /invalid_images/,
  );
  assert.deepEqual(
    parseDishPatch({
      name: 'Plato',
      images: ['/carta/plato.jpg', 'https://example.com/plato.webp'],
    }, true).images,
    ['/carta/plato.jpg', 'https://example.com/plato.webp'],
  );
});

test('valida secciones y rechaza órdenes fuera de rango', () => {
  assert.throws(
    () => parseMenuSectionPatch({ title: 'Entrantes', sort_order: -1 }, true),
    /invalid_number/,
  );
  assert.equal(parseMenuSectionPatch({ title: 'Entrantes' }, true).title, 'Entrantes');
});
