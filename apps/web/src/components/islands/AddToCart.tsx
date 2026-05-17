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
      <button onClick={handle} className="btn-lime text-base py-4 px-8 font-bold">
        Añadir al carrito <span className="ml-1">+</span>
      </button>
    );
  }
  if (variant === 'pill') {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handle();
        }}
        className="inline-flex items-center gap-1 rounded-full bg-bocado-ink text-white text-xs font-bold px-3.5 py-2 hover:bg-bocado-violet hover:shadow-glow transition-all active:scale-95"
      >
        Añadir +
      </button>
    );
  }
  return (
    <button onClick={handle} className="inline-flex items-center gap-1.5 rounded-full bg-bocado-ink text-white px-3 py-1.5 text-sm font-semibold hover:shadow-glow transition">
      Añadir <span className="text-bocado-lime">+</span>
    </button>
  );
}
