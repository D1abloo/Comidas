import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Invoice, Company } from './types.js';
import { formatEUR, formatDateTime } from './format.js';

export interface InvoicePdfPaymentBlock {
  qrPng: Uint8Array;
  title: string;
  lines: string[];
}

const INK = rgb(0.04, 0.04, 0.04);
const GREY = rgb(0.45, 0.45, 0.45);
const LIGHT = rgb(0.96, 0.95, 0.92);
const LIME = rgb(0.84, 1.0, 0.24);
const LINE = rgb(0.88, 0.87, 0.84);

export async function renderInvoicePDF(
  invoice: Invoice,
  company: Company,
  paymentBlock?: InvoicePdfPaymentBlock | null,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let { width, height } = page.getSize();
  const left = 44;
  const right = width - 44;
  const contentW = right - left;
  let y = height - 48;

  // Cabecera con banda
  page.drawRectangle({ x: 0, y: height - 88, width, height: 88, color: INK });
  page.drawText(company.trade_name || 'BocadO', { x: left, y: height - 52, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText('FACTURA SIMPLIFICADA', { x: left, y: height - 72, size: 9, font, color: rgb(0.75, 0.75, 0.75) });
  page.drawRectangle({ x: right - 148, y: height - 76, width: 148, height: 36, color: LIME });
  page.drawText(invoice.number, { x: right - 140, y: height - 62, size: 11, font: bold, color: INK });

  y = height - 108;
  drawRule(page, left, right, y);
  y -= 22;

  // Bloques emisor / cliente
  const colW = (contentW - 24) / 2;
  drawBox(page, left, y - 72, colW, 72, LIGHT);
  drawBox(page, left + colW + 24, y - 72, colW, 72, LIGHT);
  label(page, bold, 'DATOS DEL EMISOR', left + 10, y - 16);
  label(page, bold, 'DATOS DEL CLIENTE', left + colW + 34, y - 16);
  text(page, font, company.legal_name, left + 10, y - 32, 10, INK);
  text(page, font, invoice.customer_name, left + colW + 34, y - 32, 10, INK);
  text(page, font, `CIF: ${company.tax_id}`, left + 10, y - 46, 9, GREY);
  text(
    page,
    font,
    invoice.customer_tax_id ? `NIF/CIF: ${invoice.customer_tax_id}` : 'Consumidor final',
    left + colW + 34,
    y - 46,
    9,
    GREY,
  );
  text(page, font, `${company.fiscal_address}, ${company.fiscal_postal_code} ${company.fiscal_city}`, left + 10, y - 58, 8, GREY);
  text(
    page,
    font,
    `${invoice.customer_address.street} ${invoice.customer_address.number}, ${invoice.customer_address.postal_code} ${invoice.customer_address.city}`,
    left + colW + 34,
    y - 58,
    8,
    GREY,
  );

  y -= 88;
  // Meta pedido
  const metaH = 36;
  drawBox(page, left, y - metaH, contentW, metaH, rgb(1, 1, 1));
  page.drawRectangle({ x: left, y: y - metaH, width: contentW, height: metaH, borderColor: LINE, borderWidth: 1 });
  const metaCols = [
    ['Fecha emisión', formatDateTime(invoice.issued_at)],
    ['Pedido', invoice.order_id.slice(0, 8).toUpperCase()],
    [
      'Forma de pago',
      ({ tpv: 'Tarjeta TPV', cash: 'Efectivo', bizum: 'Bizum' } as Record<string, string>)[invoice.payment_method] ??
        invoice.payment_method,
    ],
    ['Estado pago', invoice.payment_status],
  ];
  metaCols.forEach(([l, v], i) => {
    const mx = left + i * (contentW / 4) + 8;
    label(page, font, l, mx, y - 14);
    text(page, bold, v, mx, y - 28, 9, INK);
  });

  y -= metaH + 20;
  label(page, bold, 'DETALLE DE CONCEPTOS', left, y);
  y -= 12;

  // Tabla
  const headY = y - 20;
  page.drawRectangle({ x: left, y: headY, width: contentW, height: 20, color: INK });
  const cols = [
    { label: 'Descripción', x: left + 8, w: 240 },
    { label: 'Ud.', x: left + 260, w: 36 },
    { label: 'P. unit.', x: left + 300, w: 70 },
    { label: 'IVA', x: left + 378, w: 40 },
    { label: 'Importe', x: right - 72, w: 64 },
  ];
  cols.forEach((c) => label(page, bold, c.label, c.x, headY + 6, rgb(1, 1, 1)));

  y = headY - 4;
  for (const line of invoice.lines) {
    y -= 20;
    text(page, font, trunc(line.description, 42), left + 8, y, 9, INK);
    text(page, font, String(line.quantity), left + 268, y, 9, INK);
    text(page, font, formatEUR(line.unit_price_cents), left + 300, y, 9, INK);
    text(page, font, `${Math.round(line.vat_rate * 100)}%`, left + 386, y, 9, GREY);
    text(page, font, formatEUR(line.total_cents), right - 72, y, 9, INK);
    drawRule(page, left, right, y - 4, 0.4);
  }

  y -= 28;
  // Totales
  const totalsX = right - 200;
  const rows = [
    ['Base imponible', formatEUR(invoice.subtotal_cents)],
    ['IVA (10%)', formatEUR(invoice.vat_cents)],
  ];
  rows.forEach(([l, v], i) => {
    text(page, font, l, totalsX, y - i * 16, 9, GREY);
    text(page, font, v, right - 72, y - i * 16, 9, INK);
  });
  y -= 44;
  page.drawRectangle({ x: totalsX - 8, y: y - 6, width: 208, height: 28, color: INK });
  text(page, bold, 'TOTAL A PAGAR', totalsX, y + 6, 11, rgb(1, 1, 1));
  text(page, bold, formatEUR(invoice.total_cents), right - 72, y + 6, 12, LIME);

  y -= 40;

  if (paymentBlock) {
    y -= 16;
    if (y < 220) {
      page = pdf.addPage([595.28, 841.89]);
      ({ width, height } = page.getSize());
      y = height - 48;
    }
    const blockH = 200;
    drawBox(page, left, y - blockH, contentW, blockH, LIGHT);
    page.drawRectangle({ x: left, y: y - blockH, width: contentW, height: blockH, borderColor: LINE, borderWidth: 1 });
    label(page, bold, paymentBlock.title, left + 12, y - 18);
    let ly = y - 36;
    for (const line of paymentBlock.lines) {
      text(page, font, line, left + 12, ly, 8, GREY);
      ly -= 12;
    }
    try {
      const qrImg = await pdf.embedPng(paymentBlock.qrPng);
      const qrSize = 120;
      page.drawImage(qrImg, {
        x: right - qrSize - 16,
        y: y - blockH + (blockH - qrSize) / 2,
        width: qrSize,
        height: qrSize,
      });
    } catch {
      text(page, font, 'QR no disponible', right - 100, y - blockH / 2, 9, GREY);
    }
    label(page, font, 'Escanea para pagar o abrir el ticket', left + 12, y - blockH + 14, GREY);
    y -= blockH + 12;
  } else if (invoice.payment_status === 'paid') {
    page.drawRectangle({ x: right - 100, y: y - 8, width: 92, height: 22, color: rgb(0.2, 0.65, 0.35) });
    text(page, bold, 'PAGADO', right - 82, y, 10, rgb(1, 1, 1));
    y -= 32;
  }

  drawRule(page, left, right, y);
  y -= 16;
  text(page, font, `${company.legal_name} · ${company.contact_email} · ${company.contact_phone}`, left, y, 8, GREY);
  y -= 12;
  text(
    page,
    font,
    'Documento emitido electrónicamente. IVA incluido. Válido a efectos fiscales según normativa vigente.',
    left,
    y,
    8,
    GREY,
  );

  return pdf.save();
}

function drawRule(p: import('pdf-lib').PDFPage, x1: number, x2: number, y: number, thickness = 1) {
  p.drawLine({ start: { x: x1, y }, end: { x: x2, y }, color: LINE, thickness });
}
function drawBox(p: import('pdf-lib').PDFPage, x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) {
  p.drawRectangle({ x, y, width: w, height: h, color });
}
function label(
  p: import('pdf-lib').PDFPage,
  f: import('pdf-lib').PDFFont,
  t: string,
  x: number,
  y: number,
  color = GREY,
) {
  p.drawText(t, { x, y, size: 7, font: f, color });
}
function text(
  p: import('pdf-lib').PDFPage,
  f: import('pdf-lib').PDFFont,
  t: string,
  x: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  p.drawText(t, { x, y, size, font: f, color });
}
function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
