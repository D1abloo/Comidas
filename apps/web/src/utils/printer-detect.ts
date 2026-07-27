export interface DetectedPrinter {
  name: string;
  isDefault?: boolean;
  status?: string;
}

type NavigatorWithPrinters = Navigator & {
  getPrinters?: () => Promise<DetectedPrinter[]>;
};

const COMMON_THERMAL_PRINTERS = [
  'EPSON TM-T20',
  'EPSON TM-T88',
  'Star TSP100',
  'Star TSP143',
  'Bixolon SRP-350',
  'Zebra ZD220',
  'Predeterminada del sistema',
];

export function supportsPrinterEnumeration(): boolean {
  if (typeof navigator === 'undefined') return false
  return typeof (navigator as NavigatorWithPrinters).getPrinters === 'function'
}

export async function detectPrinters(): Promise<{
  printers: DetectedPrinter[]
  source: 'browser' | 'suggestions'
}> {
  if (typeof navigator === 'undefined') {
    return {
      printers: COMMON_THERMAL_PRINTERS.map((name) => ({
        name,
        isDefault: name === 'Predeterminada del sistema',
      })),
      source: 'suggestions',
    }
  }

  const nav = navigator as NavigatorWithPrinters
  if (typeof nav.getPrinters === 'function') {
    try {
      const list = await nav.getPrinters();
      if (list?.length) {
        return {
          printers: list.map((p) => ({
            name: p.name,
            isDefault: p.isDefault,
            status: p.status,
          })),
          source: 'browser',
        };
      }
    } catch {
      /* permiso denegado o API no disponible */
    }
  }

  return {
    printers: COMMON_THERMAL_PRINTERS.map((name) => ({
      name,
      isDefault: name === 'Predeterminada del sistema',
    })),
    source: 'suggestions',
  };
}

export function openPrinterTestPrint(paperMm: 58 | 80): void {
  if (typeof window === 'undefined') return
  const w = window.open('', '_blank', 'noopener,noreferrer,width=360,height=640')
  if (!w) return;
  const width = paperMm === 58 ? '58mm' : '80mm';
  w.document.title = 'Prueba BocadO';
  const style = w.document.createElement('style');
  style.textContent = `
    @page { size: ${width} auto; margin: 4mm; }
    body { font: 12px/1.35 monospace; width: ${paperMm}mm; margin: 0 auto; }
    h1 { font-size: 14px; margin: 0 0 8px; }
  `;
  const title = w.document.createElement('h1');
  title.textContent = 'BocadO · prueba';
  const message = w.document.createElement('p');
  message.textContent = 'Impresora detectada correctamente.';
  const date = w.document.createElement('p');
  date.textContent = new Date().toLocaleString('es-ES');
  w.document.head.append(style);
  w.document.body.replaceChildren(title, message, date);
  window.setTimeout(() => {
    w.focus();
    w.print();
  }, 100);
}
