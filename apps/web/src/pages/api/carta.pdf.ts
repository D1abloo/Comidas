import type { APIRoute } from 'astro';
import { getStore } from '../../server/db';
import { renderMenuPDF } from '../../server/menu-pdf';

export const GET: APIRoute = async ({ request, url }) => {
  const store = getStore();
  const siteOrigin = url.origin || new URL(request.url).origin;
  const pdf = await renderMenuPDF({
    company: store.company,
    sections: store.menu_sections,
    dishes: store.dishes,
    restaurants: store.restaurants,
    siteOrigin,
  });

  return new Response(pdf, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="bocado-carta-completa.pdf"',
      'cache-control': 'public, max-age=300',
    },
  });
};
