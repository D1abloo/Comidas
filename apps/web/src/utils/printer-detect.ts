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
  return typeof (navigator as NavigatorWithPrinters).getPrinters === 'function';
}

export async function detectPrinters(): Promise<{
  printers: DetectedPrinter[];
  source: 'browser' | 'suggestions';
}> {
  const nav = navigator as NavigatorWithPrinters;
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
  const w = window.open('', '_blank', 'noopener,noreferrer,width=360,height=640');
  if (!w) return;
  const width = paperMm === 58 ? '58mm' : '80mm';
  w.document.write(`<!DOCTYPE html><html><head><title>Prueba BocadO</title>
<style>
@page { size: ${width} auto; margin: 4mm; }
body { font: 12px/1.35 monospace; width: ${paperMm}mm; margin: 0 auto; }
h1 { font-size: 14px; margin: 0 0 8px; }
</style></head><body>
<h1>BocadO · prueba</h1>
<p>Impresora detectada correctamente.</p>
<p>${new Date().toLocaleString('es-ES')}</p>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
  w.document.close();
}
