import { parsePaymentMethod } from './security.js';
import type { Address, PaymentMethod } from './types.js';

type ParsedItem = { dish_id: string; quantity: number };

export interface ParsedOrderInput {
  customer: {
    full_name: string;
    email: string;
    phone: string;
    tax_id: string | null;
  };
  delivery_address: Address;
  items: ParsedItem[];
  payment_method: PaymentMethod;
  notes: string | null;
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(
  value: unknown,
  field: string,
  min: number,
  max: number,
  optional = false,
): string | null {
  if (value == null && optional) return null;
  if (typeof value !== 'string') throw new Error(`invalid_${field}`);
  const normalized = value.trim();
  if (optional && normalized.length === 0) return null;
  if (normalized.length < min || normalized.length > max) throw new Error(`invalid_${field}`);
  return normalized;
}

export function parseOrderInput(raw: unknown): ParsedOrderInput {
  const body = object(raw);
  const customer = object(body?.customer);
  const address = object(body?.delivery_address);
  if (!body || !customer || !address) throw new Error('invalid_order');

  const email = text(customer.email, 'email', 3, 254)!;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('invalid_email');

  const paymentMethod = parsePaymentMethod(body.payment_method);
  if (!paymentMethod) throw new Error('invalid_payment_method');

  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    throw new Error('invalid_items');
  }
  const items = body.items.map((rawItem) => {
    const item = object(rawItem);
    const dishId = text(item?.dish_id, 'dish_id', 1, 100)!;
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new Error('invalid_quantity');
    }
    return { dish_id: dishId, quantity };
  });

  return {
    customer: {
      full_name: text(customer.full_name, 'full_name', 2, 100)!,
      email: email.toLowerCase(),
      phone: text(customer.phone, 'phone', 6, 24)!,
      tax_id: text(customer.tax_id, 'tax_id', 3, 32, true),
    },
    delivery_address: {
      street: text(address.street, 'street', 2, 160)!,
      number: text(address.number, 'number', 1, 20)!,
      floor: text(address.floor, 'floor', 1, 30, true),
      city: text(address.city, 'city', 2, 100)!,
      postal_code: text(address.postal_code, 'postal_code', 3, 12)!,
      country: text(address.country, 'country', 2, 80)!,
      notes: text(address.notes, 'address_notes', 1, 300, true),
    },
    items,
    payment_method: paymentMethod,
    notes: text(body.notes, 'notes', 1, 500, true),
  };
}

export async function readOrderRequest(request: Request): Promise<ParsedOrderInput> {
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > 64 * 1024) {
    throw new Error('payload_too_large');
  }
  const source = await request.text();
  if (source.length > 64 * 1024) throw new Error('payload_too_large');
  try {
    return parseOrderInput(JSON.parse(source));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('invalid_json');
    throw error;
  }
}
