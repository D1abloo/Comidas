import { useCart } from './cart-store';

const eur = (c: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100);

export default function CartDrawer() {
  const { open, setOpen, lines, setQty, total, clear } = useCart();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 font-sans">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-bocado-cream border-l border-bocado-line shadow-premium flex flex-col animate-slide-up">
        <header className="h-[76px] flex items-center justify-between px-6 border-b border-bocado-line bg-gradient-to-r from-white to-bocado-lime/10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-bocado-mute">Tu pedido</p>
            <h2 className="font-display text-xl">Cesta</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="w-10 h-10 grid place-items-center rounded-full border border-bocado-line hover:bg-bocado-lime/30 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {lines.length === 0 && (
            <div className="text-center mt-16">
              <span className="text-5xl block mb-4">🛒</span>
              <p className="text-bocado-mute text-sm">Tu cesta está vacía.<br />Explora la carta y añade algo rico.</p>
              <a href="/#catalogo" onClick={() => setOpen(false)} className="btn-lime mt-6 inline-flex text-sm">
                Ver menú
              </a>
            </div>
          )}
          {lines.map((l) => (
            <div key={l.dish_id} className="flex gap-4 items-center p-3 rounded-2xl bg-white border border-bocado-line/80 shadow-sm">
              {l.image && <img src={l.image} alt="" className="w-16 h-16 rounded-xl object-cover ring-1 ring-bocado-line" />}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-bocado-mute truncate">{l.restaurant_name ?? ''}</div>
                <div className="font-semibold truncate">{l.dish_name}</div>
                <div className="text-sm font-bold text-bocado-ink mt-0.5">{eur(l.unit_price_cents)}</div>
              </div>
              <div className="flex items-center gap-1.5 bg-bocado-paper2 rounded-full p-1">
                <button
                  onClick={() => setQty(l.dish_id, l.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-white border border-bocado-line font-medium hover:bg-bocado-lime/30 transition"
                >
                  −
                </button>
                <span className="w-6 text-center font-semibold text-sm">{l.quantity}</span>
                <button
                  onClick={() => setQty(l.dish_id, l.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-bocado-ink text-white font-medium hover:bg-bocado-violet transition"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <footer className="border-t border-bocado-line p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-bocado-mute font-medium">Subtotal</span>
            <span className="font-display text-2xl">{eur(total())}</span>
          </div>
          <a
            href={lines.length ? '/checkout' : '#'}
            onClick={(e) => {
              if (!lines.length) e.preventDefault();
              else setOpen(false);
            }}
            className={`btn-lime w-full text-center text-base py-4 ${lines.length ? '' : 'opacity-40 cursor-not-allowed pointer-events-none'}`}
          >
            Tramitar pedido →
          </a>
          {lines.length > 0 && (
            <button onClick={clear} className="text-xs text-bocado-mute hover:text-bocado-coral w-full text-center transition">
              Vaciar cesta
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}
