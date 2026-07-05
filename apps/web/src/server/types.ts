export type UUID = string;
export type ISODate = string;
export type Role = 'admin' | 'customer' | 'courier';

export const ALLERGENS = [
  'gluten',
  'lacteos',
  'huevos',
  'pescado',
  'crustaceos',
  'moluscos',
  'cacahuetes',
  'frutos_secos',
  'soja',
  'apio',
  'mostaza',
  'sesamo',
  'sulfitos',
  'altramuces',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: 'Gluten',
  lacteos: 'Lácteos',
  huevos: 'Huevos',
  pescado: 'Pescado',
  crustaceos: 'Crustáceos',
  moluscos: 'Moluscos',
  cacahuetes: 'Cacahuetes',
  frutos_secos: 'Frutos secos',
  soja: 'Soja',
  apio: 'Apio',
  mostaza: 'Mostaza',
  sesamo: 'Sésamo',
  sulfitos: 'Sulfitos',
  altramuces: 'Altramuces',
};

export interface User {
  id: UUID;
  email: string;
  full_name: string;
  role: Role;
  phone?: string;
  tax_id?: string | null;
  password_hash: string;
  created_at: ISODate;
}

export interface Company {
  id: UUID;
  legal_name: string;
  trade_name: string;
  tax_id: string;
  fiscal_address: string;
  fiscal_city: string;
  fiscal_postal_code: string;
  fiscal_country: string;
  contact_email: string;
  contact_phone: string;
}

export interface CompanySettings {
  bizum_phone: string;
  bizum_concept_template: string;
  /** Marca de tiempo del último QR Bizum generado (cambio de teléfono, etc.) */
  bizum_qr_updated_at?: string;
  tpv_enabled: boolean;
  cash_enabled: boolean;
  bizum_enabled: boolean;
  invoice_prefix: string;
  invoice_next_number: number;
  email_notifications_enabled: boolean;
  whatsapp_notifications_enabled: boolean;
  whatsapp_business_phone: string;
  delivery_fee_cents: number;
  free_delivery_from_cents: number;
  /** Impresora térmica / ticket (referencia para el equipo) */
  printer_enabled: boolean;
  printer_name: string;
  printer_paper_mm: 58 | 80;
  auto_print_on_order: boolean;
}

export interface Restaurant {
  id: UUID;
  name: string;
  slug: string;
  cuisine: string;
  rating: number;
}

/** Secciones del catálogo que el admin crea (Entrantes, Principales, etc.) */
export interface MenuSection {
  id: UUID;
  title: string;
  slug: string;
  description?: string;
  emoji?: string;
  sort_order: number;
  is_active: boolean;
  created_at: ISODate;
}

export type DishCategory = 'starter' | 'main' | 'dessert' | 'drink' | 'side';

/** Bloques editoriales que el admin puede añadir al detalle del plato */
export interface DishContentSection {
  id: string;
  title: string;
  body: string;
}

export interface Nutrition {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface Dish {
  id: UUID;
  restaurant_id: UUID;
  menu_section_id?: UUID | null;
  slug: string;
  name: string;
  description: string;
  long_description: string;
  category: DishCategory;
  cuisine: string;
  price_cents: number;
  vat_rate: number;
  delivery_time_min: number;
  rating: number;
  images: string[];
  tags: string[];
  allergens: Allergen[];
  ingredients: string[];
  nutrition: Nutrition;
  portion: string;
  is_available: boolean;
  is_featured: boolean;
  spicy_level: 0 | 1 | 2 | 3;
  vegetarian: boolean;
  vegan: boolean;
  gluten_free: boolean;
  content_sections?: DishContentSection[];
  created_at: ISODate;
}

export type PaymentMethod = 'tpv' | 'cash' | 'bizum';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'cancelled';
export type PaymentStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface OrderLine {
  dish_id: UUID;
  dish_name: string;
  unit_price_cents: number;
  quantity: number;
  notes?: string | null;
}

export interface Address {
  street: string;
  number: string;
  floor?: string | null;
  city: string;
  postal_code: string;
  country: string;
  notes?: string | null;
}

export interface OrderCustomer {
  user_id?: UUID | null;
  full_name: string;
  email: string;
  phone: string;
  tax_id?: string | null;
}

export interface Order {
  id: UUID;
  number: string;
  customer: OrderCustomer;
  delivery_address: Address;
  items: OrderLine[];
  subtotal_cents: number;
  delivery_fee_cents: number;
  vat_cents: number;
  total_cents: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string | null;
  invoice_id?: UUID | null;
  courier_id?: UUID | null;
  courier_name?: string | null;
  courier_accepted_at?: ISODate | null;
  delivered_at?: ISODate | null;
  created_at: ISODate;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unit_price_cents: number;
  vat_rate: number;
  total_cents: number;
}

export interface Invoice {
  id: UUID;
  number: string;
  order_id: UUID;
  /** Número legible del pedido (BOC-…) para ticket y QR */
  order_number?: string;
  customer_name: string;
  customer_tax_id: string | null;
  customer_address: Address;
  lines: InvoiceLine[];
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  issued_at: ISODate;
}

export interface NotificationEvent {
  id: UUID;
  order_id: UUID;
  channel: 'email' | 'whatsapp';
  kind: string;
  recipient: string;
  status: 'sent' | 'failed' | 'pending';
  created_at: ISODate;
}

export type AdminAlertKind = 'new_order' | 'bizum_paid' | 'order_delivered';

/** Alertas en tiempo real para el panel admin (nuevo pedido, Bizum pagado, etc.) */
export interface AdminAlert {
  id: UUID;
  kind: AdminAlertKind;
  order_id: UUID;
  order_number: string;
  customer_name: string;
  total_cents: number;
  item_count: number;
  seen: boolean;
  created_at: ISODate;
  courier_name?: string | null;
}
