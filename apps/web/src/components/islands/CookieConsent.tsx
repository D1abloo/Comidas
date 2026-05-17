import { useCallback, useEffect, useState } from 'react';
import {
  acceptAllCookies,
  acceptEssentialOnly,
  getConsent,
  saveConsent,
  type CookieConsentState,
} from '../../utils/cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const close = useCallback(() => setVisible(false), []);

  const applyState = useCallback(
    (state: CookieConsentState) => {
      setAnalytics(state.analytics);
      setMarketing(state.marketing);
      close();
    },
    [close],
  );

  useEffect(() => {
    const existing = getConsent();
    if (existing) {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onSettings = () => {
      const c = getConsent();
      if (c) {
        setAnalytics(c.analytics);
        setMarketing(c.marketing);
      }
      setCustomize(true);
      setVisible(true);
    };
    window.addEventListener('bocado-cookie-settings', onSettings);
    return () => window.removeEventListener('bocado-cookie-settings', onSettings);
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-consent-root" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title">
      <div className="cookie-consent-panel">
        <p className="cookie-consent-kicker">Cookies</p>
        <h2 id="cookie-consent-title" className="cookie-consent-title">
          Tu privacidad en BocadO
        </h2>
        <p className="cookie-consent-text">
          Usamos cookies necesarias para el funcionamiento del sitio (sesión, carrito y preferencias). Con tu
          permiso, también podemos usar cookies de análisis y marketing. Puedes cambiar tu elección en cualquier
          momento desde el pie de página.
        </p>

        {customize && (
          <div className="cookie-consent-options">
            <label className="cookie-consent-option cookie-consent-option--locked">
              <input type="checkbox" checked disabled />
              <span>
                <strong>Necesarias</strong>
                <span className="block text-xs text-bocado-mute mt-0.5">
                  Sesión, seguridad, carrito y recordar preferencias básicas.
                </span>
              </span>
            </label>
            <label className="cookie-consent-option">
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
              <span>
                <strong>Analítica</strong>
                <span className="block text-xs text-bocado-mute mt-0.5">
                  Nos ayudan a mejorar la web midiendo uso anónimo.
                </span>
              </span>
            </label>
            <label className="cookie-consent-option">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
              <span>
                <strong>Marketing</strong>
                <span className="block text-xs text-bocado-mute mt-0.5">
                  Ofertas y recordatorios personalizados (newsletter, promos).
                </span>
              </span>
            </label>
          </div>
        )}

        <div className="cookie-consent-actions">
          <button type="button" className="btn-lime w-full justify-center py-3" onClick={() => applyState(acceptAllCookies())}>
            Aceptar todas
          </button>
          <button type="button" className="cookie-consent-btn-secondary" onClick={() => applyState(acceptEssentialOnly())}>
            Solo necesarias
          </button>
          {customize ? (
            <button
              type="button"
              className="cookie-consent-btn-secondary"
              onClick={() => applyState(saveConsent({ analytics, marketing }))}
            >
              Guardar preferencias
            </button>
          ) : (
            <button type="button" className="cookie-consent-btn-secondary" onClick={() => setCustomize(true)}>
              Personalizar
            </button>
          )}
        </div>

        <p className="cookie-consent-links">
          <a href="/cookies">Política de cookies</a>
          <span aria-hidden>·</span>
          <a href="/privacidad">Privacidad</a>
          <span aria-hidden>·</span>
          <a href="/terminos">Condiciones</a>
        </p>
      </div>
    </div>
  );
}
