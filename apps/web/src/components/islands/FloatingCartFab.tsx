import { useCart } from './cart-store';

export default function FloatingCartFab() {
  const count = useCart((s) => s.count());
  const setOpen = useCart((s) => s.setOpen);

  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="fixed z-[90] bottom-[5.5rem] right-4 sm:right-6 lg:hidden w-14 h-14 rounded-full bg-bocado-ink text-white shadow-fab grid place-items-center transition-transform active:scale-95 hover:scale-105"
      aria-label={`Abrir cesta con ${count} artículos`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M3 6h2l2 12h12l2-9H6" />
        <circle cx="10" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
      </svg>
      <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 grid place-items-center text-[11px] font-bold bg-bocado-lime text-bocado-ink rounded-full ring-2 ring-white">
        {count}
      </span>
    </button>
  );
}
