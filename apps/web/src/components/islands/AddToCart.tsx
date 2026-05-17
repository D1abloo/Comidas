import { useCart, type CartLine } from './cart-store';

interface Props {
  line: Omit<CartLine, 'quantity'>;
  variant?: 'pill' | 'compact' | 'large';
}

export default function AddToCart({ line, variant = 'compact' }: Props) {
  const add = useCart((s) => s.add);
  const handle = () => add({ ...line, quantity: 1 });

  if (variant === 'large') {
    return (
      <button onClick={handle} className="btn-primary text-base py-3.5 px-6">
        Añadir al carrito <span className="text-bocado-lime">+</span>
      </button>
    );
  }
  if (variant === 'pill') {
    return (
      <button onClick={handle} className="btn-primary text-sm py-2 px-4">
        Añadir <span className="text-bocado-lime">+</span>
      </button>
    );
  }
  return (
    <button onClick={handle} className="inline-flex items-center gap-1.5 rounded-full bg-bocado-ink text-white px-3 py-1.5 text-sm">
      Añadir <span className="text-bocado-lime">+</span>
    </button>
  );
}
