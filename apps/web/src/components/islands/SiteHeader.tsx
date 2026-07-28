import { useState, useEffect, useRef } from 'react';
import { useCart } from './cart-store';
import CartDrawer from './CartDrawer';

const eur = (cents: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);

interface User {
  id: string;
  full_name: string;
  role: 'admin' | 'customer' | 'courier';
}

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/restaurantes', label: 'Restaurantes' },
  { href: '/pedidos', label: 'Pedidos' },
  { href: '/ayuda', label: 'Ayuda' },
];

function BurgerLogo({ compact }: { compact?: boolean }) {
  return (
    <svg
      width={compact ? 32 : 36}
      height={compact ? 32 : 36}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className="shrink-0 transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-105"
    >
      <circle cx="20" cy="20" r="18" stroke="#0a0a0a" strokeWidth="1.2" opacity="0.12" />
      <path d="M10 14c0-3.3 2.5-6 10-6s10 2.7 10 6" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M11 17.5c2.5-1 4.5-1.5 9-1.5s6.5.5 9 1.5" stroke="#5a8f00" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <rect x="11" y="19" width="18" height="4.5" rx="2.2" fill="#D6FF3D" className="origin-center transition-transform group-hover:scale-y-110" />
      <path d="M10 26c0 2.8 2.5 5 10 5s10-2.2 10-5" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="30" cy="11" r="3" fill="#D6FF3D" stroke="#0a0a0a" strokeWidth="0.8" />
    </svg>
  );
}

export default function SiteHeader({
  user,
  currentPath,
  searchQuery = '',
  paymentLabel,
}: {
  user: User | null;
  currentPath: string;
  searchQuery?: string;
  paymentLabel: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [promoHidden, setPromoHidden] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const count = useCart((s) => s.count());
  const totalCents = useCart((s) => s.total());
  const setCartOpen = useCart((s) => s.setOpen);
  const isHome = currentPath === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(href + '/');

  return (
    <>
      <div className="site-header-wrap sticky top-0 z-50">
        {!promoHidden && (
          <div className="delivery-promo animate-slide-down">
            <span className="delivery-promo-content">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"></path>
                <circle cx="7" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle>
              </svg>
              <span><strong>Envío gratis</strong> en pedidos +25 € · {paymentLabel}</span>
            </span>
            <button
              type="button"
              className="delivery-promo-close"
              aria-label="Cerrar aviso"
              onClick={() => setPromoHidden(true)}
            >
              ×
            </button>
          </div>
        )}

        <header
          className={`text-[#102019] transition-all duration-300 ease-out border-b border-[#E8E6DF] ${
            scrolled ? 'bg-white/95 backdrop-blur-lg shadow-[0_8px_30px_-18px_rgba(16,32,25,.28)]' : 'bg-white'
          }`}
        >
          <div
            className={`site-header-row transition-all duration-300 ${
              scrolled ? 'h-[62px]' : 'h-[74px]'
            }`}
          >
            <a href="/" className="site-brand group">
              <BurgerLogo compact={scrolled} />
              <span
                className={`font-semibold tracking-[-0.04em] hidden sm:inline transition-all duration-300 ${
                  scrolled ? 'text-[18px]' : 'text-[21px]'
                }`}
              >
                Bocad<span className="text-[#5F941C]">O</span>
              </span>
            </a>

            <div
              className={`site-header-search hidden md:flex ${
                isHome && !scrolled ? 'site-header-search--hidden' : 'site-header-search--visible'
              }`}
              aria-hidden={isHome && !scrolled}
            >
              <form action="/buscar" method="get" className="w-full relative group">
                <label htmlFor="site-search" className="sr-only">Buscar platos o restaurantes</label>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bocado-mute pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m16 16 5 5" />
                  </svg>
                </span>
                <input
                  name="q"
                  id="site-search"
                  type="search"
                  defaultValue={searchQuery}
                  placeholder="Buscar platos, restaurantes…"
                  tabIndex={isHome && !scrolled ? -1 : undefined}
                  className="w-full h-11 pl-11 pr-4 rounded-full bg-[#FBFAF6] border border-[#E8E6DF] text-sm text-[#102019] placeholder:text-[#706F68] focus:bg-white focus:border-[#5F941C] focus:ring-2 focus:ring-[#5F941C]/20 transition-all"
                />
              </form>
            </div>

            <nav className="site-header-nav hidden lg:flex" aria-label="Navegación principal">
              {NAV.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  data-active={isActive(l.href)}
                  className="site-header-nav-link"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <a
                  href={user.role === 'admin' ? '/admin' : user.role === 'courier' ? '/repartidor' : '/perfil'}
                  className="site-account-btn"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <circle cx="12" cy="8" r="3"></circle><path d="M6 20c0-4 2-7 6-7s6 3 6 7"></path>
                  </svg>
                  {user.role === 'admin' ? 'Panel admin' : user.role === 'courier' ? 'Repartos' : user.full_name.split(' ')[0]}
                </a>
              ) : (
                <a
                  href="/login"
                  className="site-account-btn"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <circle cx="12" cy="8" r="3"></circle><path d="M6 20c0-4 2-7 6-7s6 3 6 7"></path>
                  </svg>
                  Acceder
                </a>
              )}
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="site-cart-btn"
                aria-label={`Abrir cesta con ${count} productos por ${eur(totalCents)}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 6h2l2 12h12l2-9H6" />
                  <circle cx="10" cy="20" r="1.4" />
                  <circle cx="17" cy="20" r="1.4" />
                </svg>
                <span className="site-cart-label">
                  Cesta <span aria-hidden="true">·</span> {count}
                </span>
                <span className="site-cart-mobile-count" aria-hidden="true">{count}</span>
                <span className="site-cart-divider" aria-hidden="true"></span>
                <span className="site-cart-total">{eur(totalCents)}</span>
              </button>
              <button
                type="button"
                ref={menuButtonRef}
                className="lg:hidden w-11 h-11 grid place-items-center rounded-full border border-bocado-line text-bocado-ink hover:bg-bocado-paper2 transition"
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
              </button>
            </div>
          </div>

          {menuOpen && <div className="lg:hidden border-t border-bocado-line bg-white animate-fade-in">
            <form action="/buscar" method="get" className="px-5 py-3 md:hidden">
              <label htmlFor="mobile-site-search" className="sr-only">Buscar platos</label>
              <input
                name="q"
                id="mobile-site-search"
                type="search"
                defaultValue={searchQuery}
                placeholder="Buscar platos…"
                className="w-full h-11 px-4 rounded-full bg-bocado-paper2 border border-bocado-line text-sm text-bocado-ink placeholder:text-bocado-mute"
              />
            </form>
            <nav className="px-5 pb-4 flex flex-col gap-1">
              {NAV.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={`py-3 px-4 rounded-xl text-sm transition-all animate-fade-in ${
                    isActive(l.href) ? 'bg-bocado-paper2 font-semibold text-bocado-ink' : 'text-bocado-mute hover:bg-bocado-paper2 hover:text-bocado-ink'
                  }`}
                >
                  {l.label}
                </a>
              ))}
              <hr className="border-bocado-line my-2" />
              <a
                href={user ? (user.role === 'admin' ? '/admin' : user.role === 'courier' ? '/repartidor' : '/perfil') : '/login'}
                className="py-3 px-4 text-sm text-bocado-ink"
                onClick={() => setMenuOpen(false)}
              >
                {user ? 'Mi cuenta' : 'Iniciar sesión'}
              </a>
            </nav>
          </div>}
        </header>
      </div>
      <CartDrawer />
    </>
  );
}
