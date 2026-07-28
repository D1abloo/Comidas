import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { getStore } from '../../../../server/db';
import {
  detectDishImageExtension,
  dishImagePath,
  dishUploadDirectory,
  MAX_DISH_IMAGE_BYTES,
  removeDishUpload,
} from '../../../../server/dish-images';
import { sanitizeDishImageUrl } from '../../../../server/security';
import { persistCatalog } from '../../../../server/store-service';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const id = params.id;
  if (!id) return new Response(JSON.stringify({ error: 'missing_id' }), { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { images?: string[]; use_default?: boolean };
  const store = getStore();
  const dish = store.dishes.find((d) => d.id === id);
  if (!dish) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  const previousImages = dish.images;
  if (body.use_default) {
    dish.images = [dishImagePath(dish.slug)];
  } else if (Array.isArray(body.images) && body.images.length > 0) {
    const sanitized = body.images
      .map((u) => (typeof u === 'string' ? sanitizeDishImageUrl(u) : null))
      .filter((u): u is string => Boolean(u));
    if (!sanitized.length) {
      return new Response(JSON.stringify({ error: 'invalid_images' }), { status: 400 });
    }
    dish.images = sanitized;
  } else {
    return new Response(JSON.stringify({ error: 'invalid_images' }), { status: 400 });
  }
  await persistCatalog(store);
  await Promise.all(
    previousImages.filter((image) => !dish.images.includes(image)).map(removeDishUpload),
  );

  return new Response(JSON.stringify({ dish }), {
    headers: { 'content-type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const id = params.id;
  if (!id) return new Response(JSON.stringify({ error: 'missing_id' }), { status: 400 });

  const form = await request.formData().catch(() => null);
  const file = form?.get('image');
  if (!(file instanceof File) || file.size === 0) {
    return new Response(JSON.stringify({ error: 'missing_image' }), { status: 400 });
  }
  if (file.size > MAX_DISH_IMAGE_BYTES) {
    return new Response(JSON.stringify({ error: 'image_too_large' }), { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = detectDishImageExtension(bytes);
  if (!extension) {
    return new Response(JSON.stringify({ error: 'invalid_image_type' }), { status: 415 });
  }

  const store = getStore();
  const dish = store.dishes.find((candidate) => candidate.id === id);
  if (!dish) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  const filename = `${randomUUID()}.${extension}`;
  const uploadDirectory = dishUploadDirectory();
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(`${uploadDirectory}/${filename}`, bytes, { flag: 'wx' });
  const previousImages = dish.images;
  dish.images = [`/uploads/${filename}`];
  await persistCatalog(store);
  await Promise.all(previousImages.map(removeDishUpload));

  return new Response(JSON.stringify({ dish }), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  });
};
