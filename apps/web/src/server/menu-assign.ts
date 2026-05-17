import type { Dish } from './types.js';

/** Asigna sección de carta de forma explícita y ordena platos por nombre dentro de cada bloque. */
export function assignMenuSections(dishes: Dish[]): void {
  const byId: Record<string, string> = {
    'd-ramen': 'sec-principales',
    'd-gyozas': 'sec-entrantes',
    'd-gyozas-cerdo': 'sec-entrantes',
    'd-poke': 'sec-principales',
    'd-bowl-med': 'sec-principales',
    'd-ensalada-cesar': 'sec-entrantes',
    'd-pizza-marg': 'sec-pizzas-pasta',
    'd-pizza-diavola': 'sec-pizzas-pasta',
    'd-pizza-4formaggi': 'sec-pizzas-pasta',
    'd-pizza-pepperoni': 'sec-pizzas-pasta',
    'd-pizza-vegana': 'sec-pizzas-pasta',
    'd-lasagna': 'sec-pizzas-pasta',
    'd-carbonara': 'sec-pizzas-pasta',
    'd-pesto': 'sec-pizzas-pasta',
    'd-ravioli': 'sec-pizzas-pasta',
    'd-risotto': 'sec-pizzas-pasta',
    'd-fabada': 'sec-cazuelas',
    'd-callos': 'sec-cazuelas',
    'd-cocido': 'sec-cazuelas',
    'd-gazpacho': 'sec-entrantes',
    'd-padthai': 'sec-principales',
    'd-burger': 'sec-principales',
    'd-smash-doble': 'sec-principales',
    'd-alitas': 'sec-entrantes',
    'd-croquetas': 'sec-entrantes',
    'd-patatas': 'sec-sides',
    'd-tiramisu': 'sec-postres',
    'd-brownie': 'sec-postres',
    'd-panna-cotta': 'sec-postres',
    'd-limonada': 'sec-bebidas',
    'd-coca-cola': 'sec-bebidas',
    'd-pepsi': 'sec-bebidas',
    'd-fanta': 'sec-bebidas',
    'd-aquarius': 'sec-bebidas',
    'd-monster': 'sec-bebidas',
    'd-menu-dia-paella': 'sec-menu-dia',
    'd-menu-dia-lasana': 'sec-menu-dia',
    'd-menu-dia-bowl': 'sec-menu-dia',
  };

  for (const d of dishes) {
    if (byId[d.id]) {
      d.menu_section_id = byId[d.id];
      continue;
    }
    if (d.menu_section_id === 'sec-menu-dia') continue;
    if (d.menu_section_id) continue;

    if (d.tags?.includes('pizza') || d.tags?.includes('pasta')) {
      d.menu_section_id = 'sec-pizzas-pasta';
    } else if (d.tags?.includes('cazuela')) {
      d.menu_section_id = 'sec-cazuelas';
    } else if (d.category === 'drink' || d.tags?.some((t) => ['bebida', 'refresco', 'isotonica', 'energetica'].includes(t))) {
      d.menu_section_id = 'sec-bebidas';
    } else if (d.category === 'dessert' || d.tags?.includes('postre')) {
      d.menu_section_id = 'sec-postres';
    } else if (d.category === 'starter') {
      d.menu_section_id = 'sec-entrantes';
    } else if (d.category === 'side') {
      d.menu_section_id = 'sec-sides';
    } else if (d.category === 'main') {
      d.menu_section_id = 'sec-principales';
    } else {
      d.menu_section_id = 'sec-principales';
    }
  }
}

export function sortDishesForMenu(dishes: Dish[]): Dish[] {
  const order: Record<string, number> = {
    'sec-menu-dia': 0,
    'sec-entrantes': 1,
    'sec-pizzas-pasta': 2,
    'sec-cazuelas': 3,
    'sec-principales': 4,
    'sec-sides': 5,
    'sec-postres': 6,
    'sec-bebidas': 7,
  };
  return [...dishes].sort((a, b) => {
    const sa = order[a.menu_section_id ?? ''] ?? 99;
    const sb = order[b.menu_section_id ?? ''] ?? 99;
    if (sa !== sb) return sa - sb;
    return a.name.localeCompare(b.name, 'es');
  });
}
