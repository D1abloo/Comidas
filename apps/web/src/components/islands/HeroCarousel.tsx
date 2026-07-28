import { useCallback, useEffect, useRef, useState } from 'react';

const AUTOPLAY_MS = 6_500;

const slides = [
  {
    src: '/carta/pizza-margherita-bufala.jpg',
    alt: 'Pizza margherita artesanal recién horneada',
    eyebrow: 'Forno 21 · masa de 72 horas',
    title: 'Margherita di bufala',
    description: 'San Marzano, mozzarella de bufala, albahaca y horno vivo.',
    price: '13,90 €',
    href: '/platos/pizza-margherita-bufala',
    position: '68% center',
  },
  {
    src: '/carta/cocido-madrileno.jpg',
    alt: 'Cocido madrileño servido en cazuela',
    eyebrow: 'La Cazuela · receta de siempre',
    title: 'Cocido madrileño',
    description: 'Garbanzos, carnes y verduras cocinados despacio.',
    price: '14,90 €',
    href: '/platos/cocido-madrileno',
    position: '60% center',
  },
  {
    src: '/carta/poke-salmon.jpg',
    alt: 'Poke de salmón con verduras frescas',
    eyebrow: 'Casa Nori · fresco y ligero',
    title: 'Poke de salmón',
    description: 'Salmón marinado, aguacate, edamame, mango y sésamo.',
    price: '13,90 €',
    href: '/platos/poke-salmon',
    position: '58% center',
  },
  {
    src: '/carta/lasana-bolognesa.jpg',
    alt: 'Lasaña boloñesa gratinada',
    eyebrow: 'Pasta Luca · ragú de 4 horas',
    title: 'Lasaña boloñesa',
    description: 'Pasta fresca, ternera, bechamel y parmesano gratinado.',
    price: '12,90 €',
    href: '/platos/lasana-bolognesa',
    position: '62% center',
  },
] as const;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<number | null>(null);
  const paused = manualPaused || interactionPaused || reducedMotion;

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
    if (paused) return;
    const timer = window.setTimeout(next, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, next, paused]);

  const selectSlide = (index: number) => {
    setActive(index);
  };

  const slide = slides[active];

  return (
    <div
      className="hero-carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Platos destacados"
      tabIndex={0}
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setInteractionPaused(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          previous();
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          next();
        }
      }}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const end = event.changedTouches[0]?.clientX;
        if (touchStart.current == null || end == null) return;
        const distance = end - touchStart.current;
        if (Math.abs(distance) > 45) distance > 0 ? previous() : next();
        touchStart.current = null;
      }}
    >
      <div className="hero-carousel-images" aria-live="off">
        {slides.map((item, index) => (
          <img
            key={item.src}
            src={item.src}
            alt={index === active ? item.alt : ''}
            aria-hidden={index !== active}
            width={1600}
            height={1000}
            className={
              index === active
                ? 'hero-carousel-image hero-carousel-image--active'
                : 'hero-carousel-image'
            }
            style={{ objectPosition: item.position }}
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
          />
        ))}
      </div>

      <a key={slide.href} href={slide.href} className="hero-slide-meta" aria-live="polite">
        <span className="hero-slide-eyebrow">{slide.eyebrow}</span>
        <strong>{slide.title}</strong>
        <span className="hero-slide-description">{slide.description}</span>
        <span className="hero-slide-price">
          {slide.price}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M5 12h14M14 7l5 5-5 5" />
          </svg>
        </span>
      </a>

      <div className="hero-carousel-controls">
        <div className="hero-carousel-tabs" aria-label={`Imagen ${active + 1} de ${slides.length}`}>
          {slides.map((item, index) => (
            <button
              key={item.src}
              type="button"
              className={index === active ? 'hero-carousel-tab hero-carousel-tab--active' : 'hero-carousel-tab'}
              onClick={() => selectSlide(index)}
              aria-label={`Mostrar imagen ${index + 1}: ${item.alt}`}
              aria-current={index === active ? 'true' : undefined}
            >
              <span className="sr-only">{String(index + 1).padStart(2, '0')}</span>
              <i aria-hidden="true">
                {index === active && (
                  <b
                    key={`${active}-${paused}`}
                    className={paused ? 'hero-carousel-progress hero-carousel-progress--paused' : 'hero-carousel-progress'}
                  />
                )}
              </i>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="hero-carousel-pause"
          onClick={() => setManualPaused((value) => !value)}
          aria-label={manualPaused ? 'Reanudar carrusel' : 'Pausar carrusel'}
          aria-pressed={manualPaused}
        >
          {manualPaused ? (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}
