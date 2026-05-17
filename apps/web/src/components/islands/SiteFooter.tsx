import { useState } from 'react';
import { canUseMarketing } from '../../utils/cookie-consent';
import { InstagramIcon, TikTokIcon, XIcon } from './SocialIcons';

function FooterLogo() {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className="shrink-0 group-hover:scale-105 transition-transform duration-300"
    >
      <circle cx="20" cy="20" r="18" stroke="#0a0a0a" strokeWidth="1.2" opacity="0.2" />
      <path d="M10 14c0-3.3 2.5-6 10-6s10 2.7 10 6" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M11 17.5c2.5-1 4.5-1.5 9-1.5s6.5.5 9 1.5" stroke="#D6FF3D" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <rect x="11" y="19" width="18" height="4.5" rx="2.2" fill="#D6FF3D" />
      <path d="M10 26c0 2.8 2.5 5 10 5s10-2.2 10-5" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const PAYMENTS = ['Bizum', 'Visa', 'Mastercard', 'Efectivo'];
const SOCIAL = [
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/', Icon: InstagramIcon },
  { id: 'x', label: 'X (Twitter)', href: 'https://x.com/', Icon: XIcon },
  { id: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/', Icon: TikTokIcon },
] as const;

export default function SiteFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterNote, setNewsletterNote] = useState<string | null>(null);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-bocado-ink text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-bocado-lime via-bocado-coral to-violet-400" aria-hidden />
      <div className="border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 md:px-10 py-8 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
          {PAYMENTS.map((p) => (
            <span key={p} className="px-4 py-2 rounded-full border border-white/15 bg-white/5">
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 md:px-10 py-14 md:py-16">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4 space-y-4">
            <a href="/" className="inline-flex items-center gap-3 group">
              <FooterLogo />
              <span className="font-semibold tracking-[-0.03em] text-2xl">
                Bocad<span className="text-[#D6FF3D]">O</span>
              </span>
            </a>
            <p className="text-white/65 text-sm leading-relaxed max-w-sm">
              Comida de restaurantes de confianza, a domicilio. Seguimiento en vivo, alérgenos declarados y factura
              automática.
            </p>
            <div className="flex gap-2 pt-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full border border-white/15 grid place-items-center text-white hover:bg-bocado-lime hover:text-bocado-ink hover:border-bocado-lime transition-all duration-200"
                >
                  <s.Icon className="w-[18px] h-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-4">Descubre</p>
            <ul className="space-y-2.5 text-sm text-white/75">
              {[
                ['/', 'Inicio'],
                ['/#mas-vendido', 'Lo más vendido'],
                ['/api/carta.pdf', 'Carta completa (PDF)'],
                ['/restaurantes', 'Restaurantes'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="hover:text-white hover:translate-x-0.5 inline-block transition-all text-left"
                  onClick={() => window.dispatchEvent(new CustomEvent('bocado-show-install'))}
                >
                  📲 Instalar app
                </button>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-4">Tu cuenta</p>
            <ul className="space-y-2.5 text-sm text-white/75">
              {[
                ['/pedidos', 'Seguir pedido'],
                ['/perfil', 'Mi perfil'],
                ['/login', 'Iniciar sesión'],
                ['/registro', 'Registrarse'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-4">Newsletter</p>
            <p className="text-sm text-white/65 mb-4">Cupones y novedades de restaurantes cerca de ti.</p>
            {subscribed ? (
              <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                ¡Gracias! Pronto recibirás nuestras ofertas.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!email) return;
                  if (!canUseMarketing()) {
                    setNewsletterNote('Activa las cookies de marketing en «Gestionar cookies» para suscribirte.');
                    return;
                  }
                  setNewsletterNote(null);
                  setSubscribed(true);
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 h-11 px-4 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-bocado-lime/60 focus:ring-2 focus:ring-bocado-lime/20"
                />
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-bocado-lime text-bocado-ink font-semibold text-sm hover:brightness-95 transition shrink-0"
                >
                  Suscribirme
                </button>
              </form>
            )}
            {newsletterNote && (
              <p className="text-xs text-amber-200/90 mt-3">{newsletterNote}</p>
            )}
            <p className="text-[10px] text-white/40 mt-4">
              Para restaurantes:{' '}
              <a href="/admin/login" className="underline hover:text-white">
                Acceso empresa
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between gap-4 text-xs text-white/45">
          <span>
            © {year} BocadO Delivery SL · CIF B12345678 · Madrid, España
          </span>
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Enlaces legales">
            <a href="/terminos" className="hover:text-white transition">
              Condiciones de uso
            </a>
            <a href="/privacidad" className="hover:text-white transition">
              Privacidad
            </a>
            <a href="/cookies" className="hover:text-white transition">
              Cookies
            </a>
            <button
              type="button"
              className="hover:text-white transition text-left"
              onClick={() => window.dispatchEvent(new CustomEvent('bocado-cookie-settings'))}
            >
              Gestionar cookies
            </button>
            <a href="/ayuda" className="hover:text-white transition">
              Ayuda
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
