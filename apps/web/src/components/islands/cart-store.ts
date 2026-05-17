import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  dish_id: string;
  dish_name: string;
  restaurant_name?: string;
  unit_price_cents: number;
  quantity: number;
  image?: string;
}

interface CartState {
  open: boolean;
  setOpen: (v: boolean) => void;
  lines: CartLine[];
  add: (line: CartLine) => void;
  remove: (dish_id: string) => void;
  setQty: (dish_id: string, q: number) => void;
  clear: () => void;
  count: () => number;
  total: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      open: false,
      setOpen: (v) => set({ open: v }),
      lines: [],
      add: (line) => {
        const existing = get().lines.find((l) => l.dish_id === line.dish_id);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.dish_id === line.dish_id ? { ...l, quantity: l.quantity + line.quantity } : l,
            ),
            open: true,
          });
        } else {
          set({ lines: [...get().lines, line], open: true });
        }
      },
      remove: (dish_id) => set({ lines: get().lines.filter((l) => l.dish_id !== dish_id) }),
      setQty: (dish_id, q) =>
        set({
          lines: q <= 0
            ? get().lines.filter((l) => l.dish_id !== dish_id)
            : get().lines.map((l) => (l.dish_id === dish_id ? { ...l, quantity: q } : l)),
        }),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((s, l) => s + l.quantity, 0),
      total: () => get().lines.reduce((s, l) => s + l.unit_price_cents * l.quantity, 0),
    }),
    { name: 'bocado_cart_v2' },
  ),
);
