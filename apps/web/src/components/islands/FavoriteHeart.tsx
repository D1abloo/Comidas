import { useEffect, useState } from 'react';

export default function FavoriteHeart({ id }: { id: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('bocado_favs') ?? '[]');
      setOn(ids.includes(id));
    } catch {}
  }, [id]);
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setOn((v) => {
      const next = !v;
      try {
        const ids: string[] = JSON.parse(localStorage.getItem('bocado_favs') ?? '[]');
        const updated = next ? Array.from(new Set([...ids, id])) : ids.filter((x) => x !== id);
        localStorage.setItem('bocado_favs', JSON.stringify(updated));
      } catch {}
      return next;
    });
  };
  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      aria-label="Marcar favorito"
      className="w-9 h-9 rounded-full bg-white/90 backdrop-blur grid place-items-center border border-bocado-line hover:scale-105 transition"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={on ? '#D6FF3D' : 'none'} stroke="#0a0a0a" strokeWidth="1.6">
        <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
      </svg>
    </button>
  );
}
