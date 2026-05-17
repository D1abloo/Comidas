import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Invoice, Company } from './types.js';
import { formatEUR, formatDateTime } from './format.js';

const BLACK = rgb(0.04, 0.04, 0.04);
const GREY = rgb(0.45, 0.45, 0.45);
const LIME = rgb(0.84, 1.0, 0.24);

export async function renderInvoicePDF(invoice: Invoice, company: Company): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const left = 48;
  const right = width - 48;
  let y = height - 56;

  page.drawCircle({ x: left + 10, y: y - 4, size: 12, borderColor: BLACK, borderWidth: 1.5 });
  page.drawRectangle({ x: left + 16, y: y + 2, width: 8, height: 8, color: LIME });
  page.drawText('BocadO', { x: left + 32, y: y - 8, size: 18, font: bold, color: BLACK });
  page.drawText('FACTURA', { x: right - bold.widthOfTextAtSize('FACTURA', 12), y: y - 8, size: 12, font: bold, color: BLACK });

  y -= 36;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, color: BLACK, thickness: 1 });

  y -= 24;
  label(page, bold, 'EMISOR', left, y);
  label(page, bold, 'CLIENTE', left + 280, y);
  y -= 14;
  text(page, font, company.legal_name, left, y, 11, BLACK);
  text(page, font, invoice.customer_name, left + 280, y, 11, BLACK);
  y -= 13;
  text(page, font, `CIF/NIF: ${company.tax_id}`, left, y, 10, GREY);
  text(page, font, invoice.customer_tax_id ? `CIF/NIF: ${invoice.customer_tax_id}` : 'Consumidor final', left + 280, y, 10, GREY);
  y -= 13;
  text(page, font, company.fiscal_address, left, y, 10, GREY);
  text(page, font, `${invoice.customer_address.street}, ${invoice.customer_address.number}`, left + 280, y, 10, GREY);
  y -= 13;
  text(page, font, `${company.fiscal_postal_code} ${company.fiscal_city}, ${company.fiscal_country}`, left, y, 10, GREY);
  text(page, font, `${invoice.customer_address.postal_code} ${invoice.customer_address.city}, ${invoice.customer_address.country}`, left + 280, y, 10, GREY);

  y -= 30;
  label(page, bold, 'Nº FACTURA', left, y);
  label(page, bold, 'FECHA', left + 180, y);
  label(page, bold, 'PEDIDO', left + 320, y);
  label(page, bold, 'PAGO', left + 460, y);
  y -= 14;
  text(page, font, invoice.number, left, y, 11, BLACK);
  text(page, font, formatDateTime(invoice.issued_at), left + 180, y, 11, BLACK);
  text(page, font, invoice.order_id.slice(0, 8), left + 320, y, 11, BLACK);
  text(page, font, ({ tpv: 'Tarjeta', cash: 'Efectivo', bizum: 'Bizum' } as Record<string, string>)[invoice.payment_method] ?? invoice.payment_method, left + 460, y, 11, BLACK);

  y -= 36;
  page.drawRectangle({ x: left, y: y - 4, width: right - left, height: 22, color: rgb(0.97, 0.97, 0.94) });
  label(page, bold, 'CONCEPTO', left + 8, y + 6);
  label(page, bold, 'CANT', left + 320, y + 6);
  label(page, bold, 'PRECIO', left + 370, y + 6);
  label(page, bold, 'IVA', left + 440, y + 6);
  label(page, bold, 'TOTAL', right - 60, y + 6);

  y -= 22;
  for (const line of invoice.lines) {
    text(page, font, trunc(line.description, 48), left + 8, y - 10, 10, BLACK);
    text(page, font, String(line.quantity), left + 320, y - 10, 10, BLACK);
    text(page, font, formatEUR(line.unit_price_cents), left + 370, y - 10, 10, BLACK);
    text(page, font, `${Math.round(line.vat_rate * 100)}%`, left + 440, y - 10, 10, BLACK);
    text(page, font, formatEUR(line.total_cents), right - 60, y - 10, 10, BLACK);
    y -= 18;
    page.drawLine({ start: { x: left, y: y + 2 }, end: { x: right, y: y + 2 }, color: rgb(0.9, 0.9, 0.88), thickness: 0.5 });
  }

  y -= 16;
  text(page, font, 'Subtotal', right - 160, y, 10, GREY);
  text(page, font, formatEUR(invoice.subtotal_cents), right - 60, y, 10, BLACK);
  y -= 14;
  text(page, font, 'IVA', right - 160, y, 10, GREY);
  text(page, font, formatEUR(invoice.vat_cents), right - 60, y, 10, BLACK);
  y -= 18;
  page.drawRectangle({ x: right - 170, y: y - 4, width: 130, height: 22, color: BLACK });
  text(page, bold, 'TOTAL', right - 160, y + 4, 11, rgb(1, 1, 1));
  text(page, bold, formatEUR(invoice.total_cents), right - 96, y + 4, 11, LIME);

  text(page, font, `Factura emitida electrónicamente por ${company.legal_name}.`, left, 60, 9, GREY);
  text(page, font, 'IVA incluido. Documento válido a efectos fiscales.', left, 48, 9, GREY);

  return await pdf.save();
}

function label(p: import('pdf-lib').PDFPage, f: import('pdf-lib').PDFFont, t: string, x: number, y: number) {
  p.drawText(t, { x, y, size: 8, font: f, color: rgb(0.4, 0.4, 0.4) });
}
function text(p: import('pdf-lib').PDFPage, f: import('pdf-lib').PDFFont, t: string, x: number, y: number, size: number, color: ReturnType<typeof rgb>) {
  p.drawText(t, { x, y, size, font: f, color });
}
function trunc(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
