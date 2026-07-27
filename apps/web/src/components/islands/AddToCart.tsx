import { useCart, type CartLine } from './cart-store';

interface Props {
  line: Omit<CartLine, 'quantity'>;
  variant?: 'pill' | 'compact' | 'large' | 'circle';
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
        className="inline-flex min-h-11 items-center gap-1 rounded-full bg-[#102019] text-white text-xs font-bold px-4 py-2 hover:bg-[#5F941C] transition-all active:scale-[0.97]"
      >
        Añadir +
      </button>
    );
  }
  if (variant === 'circle') {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handle();
        }}
        className="add-circle-btn"
        aria-label={`Añadir ${line.dish_name} a la cesta`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
      </button>
    );
  }
  return (
    <button onClick={handle} className="inline-flex items-center gap-1.5 rounded-full bg-bocado-ink text-white px-3 py-1.5 text-sm font-semibold hover:shadow-glow transition">
      Añadir <span className="text-bocado-lime">+</span>
    </button>
  );
}
