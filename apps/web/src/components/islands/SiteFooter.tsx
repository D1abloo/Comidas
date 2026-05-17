import { useState } from 'react';

function FooterLogo() {
  return (
    <svg width={36} height={36} viewBox="0 0 40 40" fill="none" aria-hidden className="shrink-0 group-hover:scale-105 transition-transform duration-300">
      <circle cx="20" cy="20" r="18" stroke="#0a0a0a" strokeWidth="1.2" opacity="0.2" />
      <path d="M10 14c0-3.3 2.5-6 10-6s10 2.7 10 6" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M11 17.5c2.5-1 4.5-1.5 9-1.5s6.5.5 9 1.5" stroke="#D6FF3D" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <rect x="11" y="19" width="18" height="4.5" rx="2.2" fill="#D6FF3D" />
      <path d="M10 26c0 2.8 2.5 5 10 5s10-2.2 10-5" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const SOCIAL = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'x', label: 'X' },
  { id: 'tiktok', label: 'TikTok' },
];

export default function SiteFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-bocado-line bg-bocado-paper">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 md:px-10 py-14 md:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1.2fr]">
          <div className="space-y-4 animate-fade-up">
            <a href="/" className="inline-flex items-center gap-3 group">
              <FooterLogo />
              <span className="font-semibold tracking-[-0.03em] text-xl">
                Bocad<span className="text-[#D6FF3D]">O</span>
              </span>
            </a>
            <p className="text-bocado-mute text-sm max-w-xs leading-relaxed">
              Comida real, entrega rápida. Fotos verificadas, alérgenos declarados y tiempos que cumplimos.
            </p>
            <p className="text-xs text-bocado-mute/80 italic">Sabores limpios. Entrega real.</p>
          </div>

          <div className="animate-fade-up stagger-1">
            <p className="label mb-4">Navegación</p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['/', 'Inicio'],
                ['/restaurantes', 'Restaurantes'],
                ['/pedidos', 'Mis pedidos'],
                ['/ayuda', 'Ayuda'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="text-bocado-ink/80 hover:text-bocado-ink hover:translate-x-0.5 inline-block transition-all duration-200">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-up stagger-2">
            <p className="label mb-4">Cuenta</p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['/login', 'Iniciar sesión'],
                ['/registro', 'Crear cuenta'],
                ['/perfil', 'Mi perfil'],
                ['/admin/login', 'Acceso empresa'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="text-bocado-ink/80 hover:text-bocado-ink transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-up stagger-3">
            <p className="label mb-4">Newsletter</p>
            <p className="text-sm text-bocado-mute mb-3">Ofertas y novedades de restaurantes.</p>
            {subscribed ? (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                ¡Gracias! Te avisaremos pronto.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) setSubscribed(true);
                }}
                className="flex gap-2"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="input flex-1 text-sm"
                />
                <button type="submit" className="btn-lime px-4 shrink-0" aria-label="Suscribirse">
                  →
                </button>
              </form>
            )}
            <div className="mt-6 flex gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.id}
                  href="#"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full border border-bocado-line grid place-items-center hover:border-bocado-ink hover:bg-bocado-lime/30 hover:scale-105 transition-all duration-200"
                >
                  <span className="text-[10px] font-bold uppercase">{s.id[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-bocado-line mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-bocado-mute">
          <span>© {year} BocadO Delivery SL · CIF B12345678</span>
          <div className="flex gap-4">
            <a href="/privacidad" className="hover:text-bocado-ink transition">Privacidad</a>
            <a href="/terminos" className="hover:text-bocado-ink transition">Términos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
