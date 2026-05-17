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

function BurgerLogo() {
  return (
    <svg width={32} height={32} viewBox="0 0 40 40" fill="none" aria-hidden className="shrink-0 transition-transform duration-300 group-hover:scale-105">
      <circle cx="20" cy="20" r="18" stroke="#fff" strokeWidth="1.2" opacity="0.25" />
      <path d="M10 14c0-3.3 2.5-6 10-6s10 2.7 10 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M11 17.5c2.5-1 4.5-1.5 9-1.5s6.5.5 9 1.5" stroke="#D6FF3D" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <rect x="11" y="19" width="18" height="4.5" rx="2.2" fill="#D6FF3D" />
      <path d="M10 26c0 2.8 2.5 5 10 5s10-2.2 10-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="30" cy="11" r="3" fill="#D6FF3D" stroke="#fff" strokeWidth="0.8" />
    </svg>
  );
}

export default function SiteHeader({ user, currentPath }: { user: User | null; currentPath: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = useCart((s) => s.count());
  const setCartOpen = useCart((s) => s.setOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(href + '/');

  return (
    <>
      <header
        className={`sticky top-0 z-50 text-white transition-all duration-300 ${
          scrolled ? 'bg-bocado-ink/95 backdrop-blur-md shadow-[0_4px_24px_-8px_rgba(0,0,0,.4)]' : 'bg-bocado-ink'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 md:px-10 h-[72px] flex items-center justify-between gap-4">
          <a href="/" className="inline-flex items-center gap-2.5 group shrink-0">
            <BurgerLogo />
            <span className="font-semibold tracking-[-0.03em] text-[18px] hidden sm:inline">
              Bocad<span className="text-[#D6FF3D]">O</span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-8 text-sm">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                data-active={isActive(l.href)}
                className="relative opacity-80 hover:opacity-100 transition-opacity data-[active=true]:opacity-100 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-[#D6FF3D] after:transition-all after:duration-300 hover:after:w-full data-[active=true]:after:w-full"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <a
                href={user.role === 'admin' ? '/admin' : '/perfil'}
                className="hidden sm:inline-flex h-10 px-4 items-center rounded-full bg-white/10 hover:bg-white/20 text-sm transition-all duration-200"
              >
                {user.role === 'admin' ? 'Panel admin' : user.full_name.split(' ')[0]}
              </a>
            ) : (
              <a href="/login" className="hidden sm:inline-flex h-10 px-4 items-center rounded-full bg-white/10 hover:bg-white/20 text-sm transition-all">
                Acceder
              </a>
            )}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-full bg-white text-[#0a0a0a] h-10 px-3 sm:px-4 hover:opacity-90 transition-all active:scale-[0.98]"
              aria-label="Abrir carrito"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 6h2l2 12h12l2-9H6" />
                <circle cx="10" cy="20" r="1.4" />
                <circle cx="17" cy="20" r="1.4" />
              </svg>
              <span className="text-sm font-medium hidden sm:inline">Cesta</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 grid place-items-center text-[10px] font-semibold bg-[#D6FF3D] text-[#0a0a0a] rounded-full">
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
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-out border-t border-white/10 ${
            menuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <nav className="px-5 py-4 flex flex-col gap-1">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`py-3 px-4 rounded-xl text-sm transition-colors ${
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
      <CartDrawer />
    </>
  );
}
