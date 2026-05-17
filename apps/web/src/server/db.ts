import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type {
  CompanySettings,
  Company,
  Dish,
  Invoice,
  AdminAlert,
  MenuSection,
  NotificationEvent,
  Order,
  Restaurant,
  User,
} from './types.js';
import { extraDishes } from './extra-dishes.js';

/**
 * Almacén en memoria. Se inicializa al arrancar el servidor con datos de demo.
 * NOTA: como es modo demo, los cambios se mantienen mientras el proceso está
 * vivo y se RESETEAN al reiniciar `npm run dev`.
 */
export interface Store {
  users: User[];
  company: Company;
  settings: CompanySettings;
  restaurants: Restaurant[];
  menu_sections: MenuSection[];
  dishes: Dish[];
  orders: Order[];
  invoices: Invoice[];
  notifications: NotificationEvent[];
  admin_alerts: AdminAlert[];
  counters: { order: number; invoice: number };
}

// HMR-safe singleton
const g = globalThis as unknown as { __BOCADO_STORE?: Store };

export function getStore(): Store {
  if (!g.__BOCADO_STORE) {
    g.__BOCADO_STORE = seed();
  }
  return g.__BOCADO_STORE;
}

export function resetStore(): Store {
  g.__BOCADO_STORE = seed();
  return g.__BOCADO_STORE;
}

function seed(): Store {
  const company: Company = {
    id: randomUUID(),
    legal_name: 'BocadO Delivery SL',
    trade_name: 'BocadO',
    tax_id: 'B12345678',
    fiscal_address: 'Calle Mayor 12',
    fiscal_city: 'Madrid',
    fiscal_postal_code: '28013',
    fiscal_country: 'España',
    contact_email: 'hola@bocado.app',
    contact_phone: '+34911234567',
  };

  const settings: CompanySettings = {
    bizum_phone: process.env.BIZUM_COMPANY_PHONE ?? '+34600123456',
    bizum_concept_template: 'BocadO {{order_number}}',
    tpv_enabled: true,
    cash_enabled: true,
    bizum_enabled: true,
    invoice_prefix: 'BOC-FACT',
    invoice_next_number: 1,
    email_notifications_enabled: true,
    whatsapp_notifications_enabled: false,
    whatsapp_business_phone: '+34600123456',
    delivery_fee_cents: 199,
    free_delivery_from_cents: 2500,
    printer_enabled: true,
    printer_name: 'Ticket cocina',
    printer_paper_mm: 80,
    auto_print_on_order: false,
  };

  const menu_sections: MenuSection[] = [
    {
      id: 'sec-menu-dia',
      title: 'Menú del día',
      slug: 'menu-del-dia',
      description: 'Oferta del día — precios especiales hasta agotar existencias',
      emoji: '⭐',
      sort_order: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    { id: 'sec-entrantes', title: 'Entrantes', slug: 'entrantes', description: 'Para abrir el apetito', emoji: '🥟', sort_order: 1, is_active: true, created_at: new Date().toISOString() },
    { id: 'sec-pizzas-pasta', title: 'Pizza y pasta', slug: 'pizza-pasta', description: 'Italiano de verdad', emoji: '🍕', sort_order: 2, is_active: true, created_at: new Date().toISOString() },
    { id: 'sec-cazuelas', title: 'Cazuelas y guisos', slug: 'cazuelas', description: 'Sabores de cuchara', emoji: '🍲', sort_order: 3, is_active: true, created_at: new Date().toISOString() },
    { id: 'sec-principales', title: 'Platos principales', slug: 'principales', description: 'Lo más pedido de la casa', emoji: '🍔', sort_order: 4, is_active: true, created_at: new Date().toISOString() },
    { id: 'sec-sides', title: 'Guarniciones', slug: 'guarniciones', description: 'Acompañamientos y extras', emoji: '🍟', sort_order: 5, is_active: true, created_at: new Date().toISOString() },
    { id: 'sec-postres', title: 'Postres y bebidas', slug: 'postres-bebidas', description: 'Dulce final y refrescos', emoji: '🥤', sort_order: 6, is_active: true, created_at: new Date().toISOString() },
  ];

  const restaurants: Restaurant[] = [
    { id: 'r-casa-nori', name: 'Casa Nori', slug: 'casa-nori', cuisine: 'Asiática', rating: 4.9 },
    { id: 'r-verde-verde', name: 'Verde & Verde', slug: 'verde-y-verde', cuisine: 'Mediterránea', rating: 4.8 },
    { id: 'r-forno-21', name: 'Forno 21', slug: 'forno-21', cuisine: 'Italiana', rating: 4.7 },
    { id: 'r-prado-burger', name: 'Prado Burger', slug: 'prado-burger', cuisine: 'Burgers', rating: 4.7 },
    { id: 'r-pasta-luca', name: 'Pasta Luca', slug: 'pasta-luca', cuisine: 'Italiana', rating: 4.8 },
    { id: 'r-la-cazuela', name: 'La Cazuela', slug: 'la-cazuela', cuisine: 'Española', rating: 4.7 },
  ];

  const dishes: Dish[] = [
    {
      id: 'd-ramen',
      restaurant_id: 'r-casa-nori',
      slug: 'ramen-tonkotsu',
      name: 'Ramen tonkotsu',
      description: 'Caldo de cerdo cocido 12h, chashu, huevo marinado.',
      long_description:
        'Caldo cremoso de hueso de cerdo cocido a fuego lento durante 12 horas. Servido con noodles frescos, panceta chashu glaseada, ajo negro, cebolleta y huevo marinado en soja y mirin.',
      category: 'main',
      cuisine: 'Asiática',
      price_cents: 1250,
      vat_rate: 0.1,
      delivery_time_min: 25,
      rating: 4.9,
      images: [
        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1632709810780-b5a4343cdd5d?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['ramen', 'popular'],
      allergens: ['gluten', 'huevos', 'soja', 'sesamo'],
      ingredients: ['caldo tonkotsu', 'noodles', 'chashu de cerdo', 'huevo marinado', 'ajo negro', 'cebolleta'],
      nutrition: { kcal: 612, protein_g: 31, carbs_g: 58, fat_g: 26 },
      portion: '420 g',
      is_available: true,
      is_featured: true,
      spicy_level: 1,
      vegetarian: false,
      vegan: false,
      gluten_free: false,
      content_sections: [
        { id: 's1', title: 'El caldo', body: 'Cocido 12 horas con huesos de cerdo ibérico. Sin aditivos ni concentrados.' },
        { id: 's2', title: 'Servido con', body: 'Noodles de trigo, chashu glaseado, huevo marinado 6 min y ajo negro.' },
      ],
      created_at: new Date().toISOString(),
    },
    {
      id: 'd-gyozas',
      restaurant_id: 'r-casa-nori',
      slug: 'gyozas-pollo',
      name: 'Gyozas de pollo',
      description: '6 unidades a la plancha, salsa ponzu.',
      long_description:
        'Empanadillas japonesas rellenas de pollo, col y jengibre. Cocinadas a la plancha y al vapor. Servidas con salsa ponzu cítrica.',
      category: 'starter',
      cuisine: 'Asiática',
      price_cents: 690,
      vat_rate: 0.1,
      delivery_time_min: 20,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['starter'],
      allergens: ['gluten', 'soja', 'sesamo'],
      ingredients: ['masa de trigo', 'pollo', 'col', 'jengibre', 'salsa ponzu'],
      nutrition: { kcal: 320, protein_g: 16, carbs_g: 34, fat_g: 12 },
      portion: '6 piezas · 220 g',
      is_available: true,
      is_featured: false,
      spicy_level: 0,
      vegetarian: false,
      vegan: false,
      gluten_free: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'd-poke',
      restaurant_id: 'r-casa-nori',
      slug: 'poke-salmon',
      name: 'Poke de salmón',
      description: 'Salmón, arroz sushi, edamame, aguacate y sésamo.',
      long_description:
        'Bowl hawaiano con base de arroz de sushi, salmón marinado en soja y jengibre, edamame, aguacate, cebolla morada, mango y sésamo tostado.',
      category: 'main',
      cuisine: 'Asiática',
      price_cents: 1390,
      vat_rate: 0.1,
      delivery_time_min: 22,
      rating: 4.9,
      images: [
        'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['popular', 'saludable'],
      allergens: ['pescado', 'soja', 'sesamo'],
      ingredients: ['salmón', 'arroz sushi', 'edamame', 'aguacate', 'mango', 'cebolla morada', 'sésamo'],
      nutrition: { kcal: 540, protein_g: 28, carbs_g: 62, fat_g: 18 },
      portion: '480 g',
      is_available: true,
      is_featured: true,
      spicy_level: 0,
      vegetarian: false,
      vegan: false,
      gluten_free: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'd-bowl-med',
      restaurant_id: 'r-verde-verde',
      slug: 'bowl-mediterraneo',
      name: 'Bowl mediterráneo',
      description: 'Quinoa, hummus, falafel y verduras asadas.',
      long_description:
        'Bowl vegano con quinoa tricolor, hummus de garbanzo, falafel casero, verduras asadas de temporada, aceitunas Kalamata y vinagreta de limón.',
      category: 'main',
      cuisine: 'Mediterránea',
      price_cents: 1190,
      vat_rate: 0.1,
      delivery_time_min: 25,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['vegano', 'saludable'],
      allergens: ['gluten', 'sesamo'],
      ingredients: ['quinoa', 'hummus', 'falafel', 'verduras asadas', 'aceitunas', 'aceite de oliva'],
      nutrition: { kcal: 480, protein_g: 18, carbs_g: 64, fat_g: 16 },
      portion: '450 g',
      is_available: true,
      is_featured: true,
      spicy_level: 0,
      vegetarian: true,
      vegan: true,
      gluten_free: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'd-ensalada-cesar',
      restaurant_id: 'r-verde-verde',
      slug: 'ensalada-cesar',
      name: 'Ensalada César de pollo',
      description: 'Cogollos, pollo crujiente, parmesano y croutons.',
      long_description:
        'Cogollos de Tudela, pollo crujiente macerado en buttermilk, parmesano curado 24 meses, croutons artesanos y salsa César con anchoas.',
      category: 'main',
      cuisine: 'Mediterránea',
      price_cents: 1090,
      vat_rate: 0.1,
      delivery_time_min: 20,
      rating: 4.7,
      images: [
        'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['saludable'],
      allergens: ['gluten', 'lacteos', 'huevos', 'pescado', 'mostaza'],
      ingredients: ['cogollos', 'pollo', 'parmesano', 'crutones', 'anchoas', 'mayonesa'],
      nutrition: { kcal: 460, protein_g: 32, carbs_g: 22, fat_g: 26 },
      portion: '380 g',
      is_available: true,
      is_featured: false,
      spicy_level: 0,
      vegetarian: false,
      vegan: false,
      gluten_free: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'd-pizza-marg',
      restaurant_id: 'r-forno-21',
      slug: 'pizza-margherita-bufala',
      name: 'Pizza margherita di bufala',
      description: 'Tomate San Marzano, mozzarella di bufala, albahaca.',
      long_description:
        'Masa de fermentación lenta de 72h, tomate San Marzano DOP, mozzarella di bufala campana DOP, albahaca fresca y aceite de oliva virgen extra.',
      category: 'main',
      cuisine: 'Italiana',
      price_cents: 1390,
      vat_rate: 0.1,
      delivery_time_min: 30,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['pizza', 'vegetariano'],
      allergens: ['gluten', 'lacteos'],
      ingredients: ['masa de pizza', 'tomate San Marzano', 'mozzarella di bufala', 'albahaca', 'aceite de oliva'],
      nutrition: { kcal: 720, protein_g: 28, carbs_g: 86, fat_g: 26 },
      portion: '320 g',
      is_available: true,
      is_featured: true,
      spicy_level: 0,
      vegetarian: true,
      vegan: false,
      gluten_free: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'd-pizza-diavola',
      restaurant_id: 'r-forno-21',
      slug: 'pizza-diavola',
      name: 'Pizza diavola',
      description: 'Tomate, mozzarella fior di latte, salami picante.',
      long_description:
        'Tomate, mozzarella fior di latte, salami picante calabrese, guindilla fresca y un toque de miel para equilibrar.',
      category: 'main',
      cuisine: 'Italiana',
      price_cents: 1490,
      vat_rate: 0.1,
      delivery_time_min: 30,
      rating: 4.7,
      images: [
        'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['pizza', 'picante'],
      allergens: ['gluten', 'lacteos'],
      ingredients: ['masa', 'tomate', 'mozzarella', 'salami picante', 'guindilla', 'miel'],
      nutrition: { kcal: 780, protein_g: 31, carbs_g: 84, fat_g: 32 },
      portion: '340 g',
      is_available: true,
      is_featured: false,
      spicy_level: 2,
      vegetarian: false,
      vegan: false,
      gluten_free: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'd-burger',
      restaurant_id: 'r-prado-burger',
      slug: 'prado-classic',
      name: 'Prado Classic',
      description: 'Smash burger, cheddar curado, pickles y salsa de la casa.',
      long_description:
        'Doble smash de vaca madurada 30 días, cheddar curado, pickles caseros, cebolla caramelizada y salsa de la casa en bollo brioche.',
      category: 'main',
      cuisine: 'Burgers',
      price_cents: 1290,
      vat_rate: 0.1,
      delivery_time_min: 25,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['burger', 'popular'],
      allergens: ['gluten', 'lacteos', 'huevos', 'mostaza', 'sesamo'],
      ingredients: ['carne de vaca', 'pan brioche', 'cheddar', 'pickles', 'cebolla caramelizada', 'salsa de la casa'],
      nutrition: { kcal: 820, protein_g: 41, carbs_g: 52, fat_g: 48 },
      portion: '290 g',
      is_available: true,
      is_featured: true,
      spicy_level: 0,
      vegetarian: false,
      vegan: false,
      gluten_free: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'd-patatas',
      restaurant_id: 'r-prado-burger',
      slug: 'patatas-rustic',
      name: 'Patatas rústicas',
      description: 'Cortadas en gajo, doble fritura, romero y sal Maldon.',
      long_description:
        'Patatas cortadas en gajo a mano, doble fritura en aceite de girasol, romero fresco y sal Maldon.',
      category: 'side',
      cuisine: 'Burgers',
      price_cents: 490,
      vat_rate: 0.1,
      delivery_time_min: 20,
      rating: 4.6,
      images: [
        'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['side'],
      allergens: [],
      ingredients: ['patata', 'aceite de girasol', 'romero', 'sal'],
      nutrition: { kcal: 420, protein_g: 5, carbs_g: 52, fat_g: 20 },
      portion: '220 g',
      is_available: true,
      is_featured: false,
      spicy_level: 0,
      vegetarian: true,
      vegan: true,
      gluten_free: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'd-tiramisu',
      restaurant_id: 'r-forno-21',
      slug: 'tiramisu-clasico',
      name: 'Tiramisú clásico',
      description: 'Mascarpone, café espresso, cacao puro.',
      long_description:
        'Bizcocho de soletilla bañado en espresso, crema de mascarpone con huevo pasteurizado y cacao puro.',
      category: 'dessert',
      cuisine: 'Italiana',
      price_cents: 590,
      vat_rate: 0.1,
      delivery_time_min: 15,
      rating: 4.7,
      images: [
        'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['postre'],
      allergens: ['gluten', 'lacteos', 'huevos'],
      ingredients: ['mascarpone', 'huevos pasteurizados', 'café espresso', 'bizcochos', 'cacao'],
      nutrition: { kcal: 360, protein_g: 7, carbs_g: 38, fat_g: 20 },
      portion: '180 g',
      is_available: true,
      is_featured: false,
      spicy_level: 0,
      vegetarian: true,
      vegan: false,
      gluten_free: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'd-brownie',
      restaurant_id: 'r-prado-burger',
      slug: 'brownie-chocolate',
      name: 'Brownie de chocolate y nueces',
      description: 'Cremoso por dentro, crujiente fuera, helado de vainilla.',
      long_description:
        'Brownie de chocolate 70% con nueces de California, servido tibio con bola de helado de vainilla Madagascar.',
      category: 'dessert',
      cuisine: 'Americana',
      price_cents: 590,
      vat_rate: 0.1,
      delivery_time_min: 15,
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['postre'],
      allergens: ['gluten', 'lacteos', 'huevos', 'frutos_secos'],
      ingredients: ['chocolate 70%', 'mantequilla', 'huevos', 'harina', 'nueces', 'helado de vainilla'],
      nutrition: { kcal: 520, protein_g: 7, carbs_g: 56, fat_g: 30 },
      portion: '210 g',
      is_available: true,
      is_featured: false,
      spicy_level: 0,
      vegetarian: true,
      vegan: false,
      gluten_free: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'd-limonada',
      restaurant_id: 'r-verde-verde',
      slug: 'limonada-jengibre',
      name: 'Limonada de jengibre',
      description: 'Limón natural, jengibre fresco, hierbabuena.',
      long_description:
        'Bebida refrescante de limones de Murcia, jengibre fresco rallado y hojas de hierbabuena. Sin azúcares añadidos.',
      category: 'drink',
      cuisine: 'Mediterránea',
      price_cents: 350,
      vat_rate: 0.1,
      delivery_time_min: 15,
      rating: 4.7,
      images: [
        'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=1200&q=80',
      ],
      tags: ['bebida'],
      allergens: [],
      ingredients: ['limón', 'jengibre', 'hierbabuena', 'agua'],
      nutrition: { kcal: 60, protein_g: 0, carbs_g: 14, fat_g: 0 },
      portion: '330 ml',
      is_available: true,
      is_featured: false,
      spicy_level: 0,
      vegetarian: true,
      vegan: true,
      gluten_free: true,
      created_at: new Date().toISOString(),
    },
    ...extraDishes(),
  ];

  const adminHash = bcrypt.hashSync('admin1234', 8);
  const customerHash = bcrypt.hashSync('cliente1234', 8);

  const users: User[] = [
    {
      id: 'u-admin',
      email: 'admin@bocado.app',
      full_name: 'Equipo BocadO',
      role: 'admin',
      phone: '+34911234567',
      tax_id: null,
      password_hash: adminHash,
      created_at: new Date().toISOString(),
    },
    {
      id: 'u-cliente',
      email: 'cliente@bocado.app',
      full_name: 'Cliente Demo',
      role: 'customer',
      phone: '+34600111222',
      tax_id: null,
      password_hash: customerHash,
      created_at: new Date().toISOString(),
    },
  ];

  for (const d of dishes) {
    if (d.menu_section_id === 'sec-menu-dia') continue;
    if (d.menu_section_id) continue;
    if (d.tags?.includes('pizza') || d.tags?.includes('pasta')) {
      d.menu_section_id = 'sec-pizzas-pasta';
      continue;
    }
    if (d.tags?.includes('cazuela')) {
      d.menu_section_id = 'sec-cazuelas';
      continue;
    }
    d.menu_section_id =
      d.category === 'starter'
        ? 'sec-entrantes'
        : d.category === 'main'
          ? 'sec-principales'
          : d.category === 'side'
            ? 'sec-sides'
            : 'sec-postres';
  }

  // Algunos pedidos de muestra para que el dashboard tenga datos
  const seedOrders: Order[] = [
    sampleOrder('001041', 'Luis G.', 'luis@example.com', 'tpv', 'paid', 'delivered', [
      { dish: dishes.find((x) => x.id === 'd-ramen')!, qty: 1 },
      { dish: dishes.find((x) => x.id === 'd-bowl-med')!, qty: 1 },
    ]),
    sampleOrder('001042', 'Marta R.', 'marta@example.com', 'bizum', 'awaiting_confirmation', 'delivering', [
      { dish: dishes.find((x) => x.id === 'd-pizza-marg')!, qty: 1 },
      { dish: dishes.find((x) => x.id === 'd-carbonara')!, qty: 1 },
    ]),
    sampleOrder('001043', 'Ana V.', 'ana@example.com', 'cash', 'pending', 'preparing', [
      { dish: dishes.find((x) => x.id === 'd-fabada')!, qty: 1 },
    ]),
  ];

  return {
    users,
    company,
    settings,
    restaurants,
    menu_sections,
    dishes,
    orders: seedOrders,
    invoices: [],
    notifications: [],
    admin_alerts: [],
    counters: { order: 1044, invoice: 1 },
  };
}

function sampleOrder(
  numberSeq: string,
  name: string,
  email: string,
  pm: Order['payment_method'],
  ps: Order['payment_status'],
  st: Order['status'],
  lines: { dish: Dish; qty: number }[],
): Order {
  const items = lines.map((l) => ({
    dish_id: l.dish.id,
    dish_name: l.dish.name,
    unit_price_cents: l.dish.price_cents,
    quantity: l.qty,
  }));
  const subtotal = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
  return {
    id: randomUUID(),
    number: `BOC-2026-${numberSeq}`,
    customer: { full_name: name, email, phone: '+34600000000' },
    delivery_address: {
      street: 'Calle Demo',
      number: '12',
      city: 'Madrid',
      postal_code: '28013',
      country: 'España',
    },
    items,
    subtotal_cents: subtotal,
    delivery_fee_cents: 199,
    vat_cents: Math.round(subtotal * 0.1),
    total_cents: subtotal + 199,
    status: st,
    payment_method: pm,
    payment_status: ps,
    created_at: new Date(Date.now() - Math.random() * 86400_000).toISOString(),
  };
}
