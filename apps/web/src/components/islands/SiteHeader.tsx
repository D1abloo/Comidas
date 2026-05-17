import { useState, useEffect } from 'react';
import { useCart } from './cart-store';
import CartDrawer from './CartDrawer';

interface User {
  id: string;
  full_name: string;
  role: 'admin' | 'customer';
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
      width={compact ? 28 : 32}
      height={compact ? 28 : 32}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className="shrink-0 transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-105"
    >
      <circle cx="20" cy="20" r="18" stroke="#fff" strokeWidth="1.2" opacity="0.25" />
      <path d="M10 14c0-3.3 2.5-6 10-6s10 2.7 10 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M11 17.5c2.5-1 4.5-1.5 9-1.5s6.5.5 9 1.5" stroke="#D6FF3D" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <rect x="11" y="19" width="18" height="4.5" rx="2.2" fill="#D6FF3D" className="origin-center transition-transform group-hover:scale-y-110" />
      <path d="M10 26c0 2.8 2.5 5 10 5s10-2.2 10-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="30" cy="11" r="3" fill="#D6FF3D" stroke="#fff" strokeWidth="0.8" className="animate-pulse-soft" />
    </svg>
  );
}

export default function SiteHeader({ user, currentPath }: { user: User | null; currentPath: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [promoHidden, setPromoHidden] = useState(false);
  const count = useCart((s) => s.count());
  const setCartOpen = useCart((s) => s.setOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(href + '/');

  return (
    <>
      <div className="site-header-wrap sticky top-0 z-50">
        {!promoHidden && (
          <div className="bg-bocado-lime text-bocado-ink text-center text-xs sm:text-sm py-2 px-10 relative animate-slide-down">
            <span className="font-medium">Envío gratis</span> en pedidos +25 € · Bizum, tarjeta o efectivo
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-black/10 text-sm"
              aria-label="Cerrar aviso"
              onClick={() => setPromoHidden(true)}
            >
              ×
            </button>
          </div>
        )}

        <header
          className={`text-white transition-all duration-300 ease-out ${
            scrolled
              ? 'bg-bocado-ink/96 backdrop-blur-lg shadow-[0_8px_32px_-12px_rgba(0,0,0,.45)]'
              : 'bg-bocado-ink'
          }`}
        >
          <div
            className={`max-w-[1280px] mx-auto px-5 sm:px-6 md:px-10 flex items-center justify-between gap-4 transition-all duration-300 ${
              scrolled ? 'h-[60px]' : 'h-[72px]'
            }`}
          >
            <a href="/" className="inline-flex items-center gap-2.5 group shrink-0">
              <BurgerLogo compact={scrolled} />
              <span
                className={`font-semibold tracking-[-0.03em] hidden sm:inline transition-all duration-300 ${
                  scrolled ? 'text-[16px]' : 'text-[18px]'
                }`}
              >
                Bocad<span className="text-[#D6FF3D]">O</span>
              </span>
            </a>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <form action="/" method="get" className="w-full relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m16 16 5 5" />
                  </svg>
                </span>
                <input
                  name="q"
                  type="search"
                  placeholder="Buscar platos, restaurantes…"
                  className="w-full h-10 pl-11 pr-4 rounded-full bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/45 focus:bg-white/15 focus:border-bocado-lime/50 focus:outline-none focus:ring-2 focus:ring-bocado-lime/20 transition-all"
                />
              </form>
            </div>

            <nav className="hidden lg:flex items-center gap-6 text-sm">
              {NAV.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  data-active={isActive(l.href)}
                  className="relative py-1 opacity-75 hover:opacity-100 transition-all data-[active=true]:opacity-100 data-[active=true]:font-medium after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:scale-x-0 after:bg-[#D6FF3D] after:transition-transform after:duration-300 hover:after:scale-x-100 data-[active=true]:after:scale-x-100"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <a
                  href={user.role === 'admin' ? '/admin' : '/perfil'}
                  className="hidden sm:inline-flex h-10 px-4 items-center rounded-full bg-white/10 hover:bg-white/20 text-sm transition-all duration-200 hover:scale-[1.02]"
                >
                  {user.role === 'admin' ? 'Panel admin' : user.full_name.split(' ')[0]}
                </a>
              ) : (
                <a
                  href="/login"
                  className="hidden sm:inline-flex h-10 px-4 items-center rounded-full bg-white/10 hover:bg-white/20 text-sm transition-all"
                >
                  Acceder
                </a>
              )}
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative inline-flex items-center gap-2 rounded-full bg-white text-[#0a0a0a] h-10 px-3 sm:px-4 hover:shadow-[0_4px_20px_-4px_rgba(214,255,61,.6)] transition-all active:scale-[0.97]"
                aria-label="Abrir carrito"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 6h2l2 12h12l2-9H6" />
                  <circle cx="10" cy="20" r="1.4" />
                  <circle cx="17" cy="20" r="1.4" />
                </svg>
                <span className="text-sm font-medium hidden sm:inline">Cesta</span>
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 grid place-items-center text-[10px] font-semibold bg-[#D6FF3D] text-[#0a0a0a] rounded-full animate-pulse-soft">
                    {count}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="lg:hidden w-10 h-10 grid place-items-center rounded-full hover:bg-white/10 transition"
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

          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ease-out border-t border-white/10 bg-bocado-ink ${
              menuOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="px-5 py-3 md:hidden">
              <input
                type="search"
                placeholder="Buscar…"
                className="w-full h-10 px-4 rounded-full bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/45"
              />
            </div>
            <nav className="px-5 pb-4 flex flex-col gap-1">
              {NAV.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={`py-3 px-4 rounded-xl text-sm transition-all animate-fade-in ${
                    isActive(l.href) ? 'bg-white/15 font-medium' : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  {l.label}
                </a>
              ))}
              <hr className="border-white/10 my-2" />
              <a
                href={user ? (user.role === 'admin' ? '/admin' : '/perfil') : '/login'}
                className="py-3 px-4 text-sm text-white/80"
                onClick={() => setMenuOpen(false)}
              >
                {user ? 'Mi cuenta' : 'Iniciar sesión'}
              </a>
            </nav>
          </div>
        </header>
      </div>
      <CartDrawer />
    </>
  );
}
