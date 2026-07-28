import { useCallback, useEffect, useState } from 'react';

const slides = [
  {
    src: '/carta/pizza-margherita-bufala.jpg',
    alt: 'Pizza margherita artesanal recién horneada',
  },
  {
    src: '/carta/cocido-madrileno.jpg',
    alt: 'Cocido madrileño servido en cazuela',
  },
  {
    src: '/carta/poke-salmon.jpg',
    alt: 'Poke de salmón con verduras frescas',
  },
  {
    src: '/carta/lasana-bolognesa.jpg',
    alt: 'Lasaña boloñesa gratinada',
  },
] as const;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const previous = useCallback(() => {
    setActive((current) => (current - 1 + slides.length) % slides.length);
  }, []);

  const next = useCallback(() => {
    setActive((current) => (current + 1) % slides.length);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(next, 5_500);
    return () => window.clearInterval(timer);
  }, [next, paused, reducedMotion]);

  const slide = slides[active];

  return (
    <div
      className="hero-carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Platos destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <img
        key={slide.src}
        src={slide.src}
        alt={slide.alt}
        width={800}
        height={560}
        className="hero-carousel-image"
        loading={active === 0 ? 'eager' : 'lazy'}
        fetchPriority={active === 0 ? 'high' : 'auto'}
      />

      <div className="hero-carousel-controls">
        <button type="button" onClick={previous} aria-label="Mostrar plato anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="hero-carousel-dots" aria-label={`Imagen ${active + 1} de ${slides.length}`}>
          {slides.map((item, index) => (
            <button
              key={item.src}
              type="button"
              className={index === active ? 'hero-carousel-dot hero-carousel-dot--active' : 'hero-carousel-dot'}
              onClick={() => setActive(index)}
              aria-label={`Mostrar imagen ${index + 1}: ${item.alt}`}
              aria-current={index === active ? 'true' : undefined}
            />
          ))}
        </div>
        <button type="button" onClick={next} aria-label="Mostrar plato siguiente">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? 'Reanudar carrusel' : 'Pausar carrusel'}
          aria-pressed={paused}
        >
          {paused ? (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}
