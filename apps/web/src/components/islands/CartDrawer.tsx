import { useCart } from './cart-store';

const eur = (c: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100);

export default function CartDrawer() {
  const { open, setOpen, lines, setQty, total, clear } = useCart();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-bocado-paper border-l border-bocado-line shadow-2xl flex flex-col">
        <header className="h-[72px] flex items-center justify-between px-6 border-b border-bocado-line">
          <h2 className="text-lg font-semibold tracking-tight">Tu cesta</h2>
          <button onClick={() => setOpen(false)} aria-label="Cerrar" className="w-10 h-10 grid place-items-center rounded-full hover:bg-bocado-ink/5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {lines.length === 0 && (
            <p className="text-bocado-mute text-sm mt-12 text-center">Aún no has añadido nada.</p>
          )}
          {lines.map((l) => (
            <div key={l.dish_id} className="flex gap-3 items-center">
              {l.image && <img src={l.image} alt="" className="w-16 h-16 rounded-2xl object-cover" />}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-bocado-mute truncate">{l.restaurant_name ?? ''}</div>
                <div className="font-medium truncate">{l.dish_name}</div>
                <div className="text-sm text-bocado-mute">{eur(l.unit_price_cents)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(l.dish_id, l.quantity - 1)} className="w-8 h-8 rounded-full border border-bocado-line">−</button>
                <span className="w-6 text-center">{l.quantity}</span>
                <button onClick={() => setQty(l.dish_id, l.quantity + 1)} className="w-8 h-8 rounded-full border border-bocado-line">+</button>
              </div>
            </div>
          ))}
        </div>
        <footer className="border-t border-bocado-line p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-bocado-mute">Subtotal</span>
            <span className="font-medium">{eur(total())}</span>
          </div>
          <a
            href={lines.length ? '/checkout' : '#'}
            onClick={(e) => { if (!lines.length) e.preventDefault(); else setOpen(false); }}
            className={`btn-primary w-full ${lines.length ? '' : 'opacity-40 cursor-not-allowed'}`}
          >
            Tramitar pedido →
          </a>
          {lines.length > 0 && (
            <button onClick={clear} className="text-xs text-bocado-mute hover:text-bocado-ink underline w-full text-center">
              Vaciar cesta
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}
