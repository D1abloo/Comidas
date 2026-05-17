import { useCallback, useState } from 'react';
import {
  detectPrinters,
  openPrinterTestPrint,
  supportsPrinterEnumeration,
  type DetectedPrinter,
} from '../../utils/printer-detect';

type Props = {
  paperMm: 58 | 80;
  printerName: string;
  onSelect: (name: string, enable?: boolean) => void;
};

export default function PrinterDetect({ paperMm, printerName, onSelect }: Props) {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [printers, setPrinters] = useState<DetectedPrinter[] | null>(null);
  const [source, setSource] = useState<'browser' | 'suggestions' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const runDetect = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await detectPrinters();
      setPrinters(result.printers);
      setSource(result.source);
      const preferred = result.printers.find((p) => p.isDefault) ?? result.printers[0];
      if (preferred && result.source === 'browser') {
        onSelect(preferred.name, true);
        setMessage(`Impresora «${preferred.name}» seleccionada automáticamente.`);
      } else if (result.source === 'suggestions') {
        setMessage(
          'Tu navegador no expone la lista de impresoras. Elige un modelo habitual o imprime la prueba y selecciona la tuya en el diálogo del sistema.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  const handleAcceptDetect = () => {
    setConsent(true);
    if (!supportsPrinterEnumeration()) {
      openPrinterTestPrint(paperMm);
    }
    void runDetect();
  };

  return (
    <div className="mt-3 rounded-xl border border-black/10 bg-bocado-cream/40 p-4 text-sm">
      <p className="font-semibold text-bocado-ink">Detectar impresora en este equipo</p>
      <p className="mt-1 text-bocado-mute text-xs leading-relaxed">
        {supportsPrinterEnumeration()
          ? 'Chrome/Edge pueden listar las impresoras conectadas si aceptas la búsqueda.'
          : 'Se abrirá una impresión de prueba para que elijas la impresora en el cuadro del sistema.'}
      </p>

      {!consent ? (
        <button
          type="button"
          className="mt-3 w-full rounded-lg border border-bocado-violet/30 bg-white px-3 py-2 text-sm font-semibold text-bocado-violet hover:bg-bocado-violet/5 transition"
          onClick={handleAcceptDetect}
        >
          Buscar impresoras (acepto)
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-bocado-violet px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            disabled={loading}
            onClick={() => void runDetect()}
          >
            {loading ? 'Buscando…' : 'Volver a buscar'}
          </button>
          <button
            type="button"
            className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold hover:bg-white transition"
            onClick={() => openPrinterTestPrint(paperMm)}
          >
            Imprimir prueba
          </button>
        </div>
      )}

      {message && <p className="mt-2 text-xs text-emerald-700">{message}</p>}

      {printers && printers.length > 0 && (
        <ul className="mt-3 max-h-40 overflow-y-auto space-y-1" role="listbox" aria-label="Impresoras detectadas">
          {printers.map((p) => (
            <li key={p.name}>
              <button
                type="button"
                role="option"
                aria-selected={printerName === p.name}
                className={`w-full text-left rounded-lg px-3 py-2 text-xs transition ${
                  printerName === p.name
                    ? 'bg-bocado-lime/30 font-bold ring-1 ring-bocado-lime'
                    : 'hover:bg-white/80'
                }`}
                onClick={() => {
                  onSelect(p.name, true);
                  setMessage(`Impresora «${p.name}» asignada.`);
                }}
              >
                {p.name}
                {p.isDefault ? ' · predeterminada' : ''}
                {source === 'browser' && p.status ? ` · ${p.status}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
