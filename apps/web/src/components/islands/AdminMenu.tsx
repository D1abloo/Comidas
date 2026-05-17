import { useEffect, useState } from 'react';

export default function AdminMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('admin-nav-open', open);
    return () => document.body.classList.remove('admin-nav-open');
  }, [open]);

  return (
    <button
      type="button"
      className="lg:hidden w-10 h-10 rounded-full border border-bocado-line grid place-items-center hover:bg-bocado-ink/5 transition"
      aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
      </svg>
    </button>
  );
}
