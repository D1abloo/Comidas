import { useCart } from './cart-store';
import CartDrawer from './CartDrawer';

export default function CartButton() {
  const count = useCart((s) => s.count());
  const setOpen = useCart((s) => s.setOpen);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center gap-2 rounded-full bg-white text-bocado-ink h-10 px-4 hover:opacity-90"
        aria-label="Abrir carrito"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 6h2l2 12h12l2-9H6" />
          <circle cx="10" cy="20" r="1.4" />
          <circle cx="17" cy="20" r="1.4" />
        </svg>
        <span className="text-sm font-medium">Cesta</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 grid place-items-center text-[10px] font-semibold bg-bocado-lime text-bocado-ink rounded-full">
            {count}
          </span>
        )}
      </button>
      <CartDrawer />
    </>
  );
}
