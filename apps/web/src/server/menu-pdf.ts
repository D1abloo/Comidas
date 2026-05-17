import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  ALLERGENS,
  ALLERGEN_LABELS,
  type Allergen,
  type Company,
  type Dish,
  type MenuSection,
  type Restaurant,
} from './types.js';
import { formatEUR } from './format.js';
import { clearMenuPdfImageCache, DISH_THUMB_PT, embedDishThumbnail } from './menu-pdf-images.js';

const INK = rgb(0.04, 0.04, 0.04);
const GREY = rgb(0.45, 0.45, 0.45);
const LIGHT = rgb(0.96, 0.95, 0.92);
const LIME = rgb(0.84, 1.0, 0.24);
const LINE = rgb(0.88, 0.87, 0.84);
const DAILY_TINT = rgb(0.98, 0.99, 0.9);
const PAGE_H = 841.89;
const PAGE_W = 595.28;
const MARGIN = 44;
const FOOTER_Y = 52;
const DAILY_SECTION_ID = 'sec-menu-dia';
const TEXT_GAP = 10;

export interface MenuPdfInput {
  company: Company;
  sections: MenuSection[];
  dishes: Dish[];
  restaurants: Restaurant[];
}

type PdfCtx = {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  contentW: number;
  restById: Record<string, string>;
  newPage: () => void;
  ensureSpace: (needed: number) => void;
};

function pdfSafeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = pdfSafeText(text).split(' ').filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function allergenLine(allergens: Allergen[]): string {
  if (!allergens.length) return 'Alérgenos: sin alérgenos declarados en ficha.';
  return `Alérgenos: ${allergens.map((a) => ALLERGEN_LABELS[a]).join(', ')}.`;
}

async function drawDishEntry(ctx: PdfCtx, dish: Dish): Promise<void> {
  const { font, bold, contentW, restById, ensureSpace } = ctx;
  let { page, y } = ctx;

  const thumb = DISH_THUMB_PT;
  const textX = MARGIN + thumb + TEXT_GAP;
  const textW = contentW - thumb - TEXT_GAP;

  const rest = restById[dish.restaurant_id] ?? '';
  const header = pdfSafeText(`${dish.name}  ·  ${formatEUR(dish.price_cents)}`);
  const meta = [
    dish.is_available ? 'Estado: Disponible' : 'Estado: No disponible',
    rest,
    dish.portion,
    dish.vegetarian ? 'Vegetariano' : '',
    dish.vegan ? 'Vegano' : '',
    dish.gluten_free ? 'Sin gluten' : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const descLines = wrapLines(dish.description || dish.long_description, font, 9, textW);
  const allergenLines = wrapLines(allergenLine(dish.allergens), font, 8, textW);
  const textH = 14 + (meta ? 11 : 0) + descLines.length * 11 + allergenLines.length * 10;
  const rowH = Math.max(thumb + 6, textH) + 14;

  ensureSpace(rowH);

  const embedded = await embedDishThumbnail(ctx.pdf, dish.images[0]);
  const rowTop = y;

  if (embedded) {
    const scale = thumb / Math.max(embedded.width, embedded.height);
    const w = embedded.width * scale;
    const h = embedded.height * scale;
    const imgY = rowTop - h + 2;
    page.drawRectangle({
      x: MARGIN - 1,
      y: imgY - 1,
      width: thumb + 2,
      height: thumb + 2,
      borderColor: LINE,
      borderWidth: 0.5,
      color: rgb(1, 1, 1),
    });
    page.drawImage(embedded, {
      x: MARGIN + (thumb - w) / 2,
      y: imgY,
      width: w,
      height: h,
    });
  }

  let ty = rowTop;
  page.drawText(header, { x: textX, y: ty, size: 11, font: bold, color: INK });
  ty -= 14;

  if (meta) {
    page.drawText(pdfSafeText(meta), { x: textX, y: ty, size: 8, font, color: GREY });
    ty -= 11;
  }

  for (const ln of descLines) {
    page.drawText(ln, { x: textX, y: ty, size: 9, font, color: INK });
    ty -= 11;
  }

  for (const ln of allergenLines) {
    page.drawText(ln, { x: textX, y: ty, size: 8, font, color: rgb(0.55, 0.35, 0.1) });
    ty -= 10;
  }

  y = rowTop - rowH + 4;
  drawRule(page, MARGIN, PAGE_W - MARGIN, y);
  y -= 10;
  ctx.y = y;
  ctx.page = page;
}

async function drawSectionBlock(ctx: PdfCtx, block: { title: string; subtitle?: string; items: Dish[]; daily?: boolean }) {
  const { font, bold, contentW, ensureSpace } = ctx;
  let { page, y } = ctx;

  if (!block.items.length) return;

  ensureSpace(56);
  const barColor = block.daily ? DAILY_TINT : LIGHT;
  page.drawRectangle({ x: MARGIN, y: y - 28, width: contentW, height: 28, color: barColor });
  if (block.daily) {
    page.drawRectangle({ x: MARGIN, y: y - 28, width: 4, height: 28, color: LIME });
  }
  page.drawText(pdfSafeText(block.title), { x: MARGIN + (block.daily ? 14 : 10), y: y - 18, size: 13, font: bold, color: INK });
  y -= 36;

  if (block.subtitle) {
    for (const ln of wrapLines(block.subtitle, font, 9, contentW - 8)) {
      ensureSpace(14);
      page.drawText(ln, { x: MARGIN + 4, y, size: 9, font, color: GREY });
      y -= 12;
    }
    y -= 4;
  }

  ctx.y = y;
  ctx.page = page;

  for (const dish of block.items) {
    await drawDishEntry(ctx, dish);
  }

  ctx.y -= 8;
}

export async function renderMenuPDF(input: MenuPdfInput): Promise<Uint8Array> {
  clearMenuPdfImageCache();

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const restById = Object.fromEntries(input.restaurants.map((r) => [r.id, r.name]));

  const contentW = PAGE_W - MARGIN * 2;
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - 48;

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - 56;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < FOOTER_Y + 24) newPage();
  };

  const ctx: PdfCtx = {
    pdf,
    page,
    font,
    bold,
    y,
    contentW,
    restById,
    newPage,
    ensureSpace,
  };

  page.drawRectangle({ x: 0, y: PAGE_H - 92, width: PAGE_W, height: 92, color: INK });
  page.drawText(pdfSafeText(input.company.trade_name || 'BocadO'), {
    x: MARGIN,
    y: PAGE_H - 48,
    size: 24,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText('CARTA COMPLETA · INFORMACIÓN DE ALÉRGENOS', {
    x: MARGIN,
    y: PAGE_H - 72,
    size: 9,
    font,
    color: rgb(0.75, 0.75, 0.75),
  });
  page.drawRectangle({ x: PAGE_W - MARGIN - 120, y: PAGE_H - 76, width: 120, height: 32, color: LIME });
  page.drawText(
    pdfSafeText(
      new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    ),
    { x: PAGE_W - MARGIN - 112, y: PAGE_H - 64, size: 9, font: bold, color: INK },
  );

  y = PAGE_H - 112;
  const intro =
    'Reglamento (UE) 1169/2011. Los 14 alérgenos obligatorios figuran en cada plato. Puede haber trazas no declaradas; consulta al restaurante si tienes alergia o intolerancia.';
  for (const ln of wrapLines(intro, font, 8, contentW)) {
    page.drawText(ln, { x: MARGIN, y, size: 8, font, color: GREY });
    y -= 10;
  }
  y -= 10;
  ctx.y = y;
  ctx.page = page;

  const activeSections = [...input.sections]
    .filter((s) => s.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const dishes = [...input.dishes].sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const sectionIds = new Set(activeSections.map((s) => s.id));
  const orphans = dishes.filter((d) => !d.menu_section_id || !sectionIds.has(d.menu_section_id));

  const blocks: { title: string; subtitle?: string; items: Dish[]; daily?: boolean }[] = activeSections.map((sec) => ({
    title: sec.title,
    subtitle: sec.description,
    items: dishes.filter((d) => d.menu_section_id === sec.id),
    daily: sec.id === DAILY_SECTION_ID,
  }));

  if (orphans.length) {
    blocks.push({ title: 'Otros platos', items: orphans });
  }

  for (const block of blocks) {
    await drawSectionBlock(ctx, block);
    y = ctx.y;
    page = ctx.page;
  }

  ensureSpace(48);
  y = ctx.y - 8;
  page.drawText('LEYENDA — 14 ALÉRGENOS (UE)', { x: MARGIN, y, size: 10, font: bold, color: INK });
  y -= 16;

  for (const key of ALLERGENS) {
    ensureSpace(14);
    page.drawText(pdfSafeText(`• ${ALLERGEN_LABELS[key]}`), { x: MARGIN, y, size: 8, font, color: INK });
    y -= 12;
  }

  y -= 6;
  ensureSpace(24);
  const footerNote =
    'Documento informativo generado por BocadO. Precios con IVA incluido. Sujetos a disponibilidad del restaurante.';
  for (const ln of wrapLines(footerNote, font, 7, contentW)) {
    page.drawText(ln, { x: MARGIN, y, size: 7, font, color: GREY });
    y -= 9;
  }

  const totalPages = pdf.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    drawPageFooter(pdf.getPage(i), font, i + 1, totalPages);
  }

  return pdf.save();
}

function drawRule(p: PDFPage, x1: number, x2: number, y: number) {
  p.drawLine({ start: { x: x1, y }, end: { x: x2, y }, color: LINE, thickness: 0.5 });
}

function drawPageFooter(p: PDFPage, font: PDFFont, num: number, total?: number) {
  const label = total ? `BocadO · Carta · ${num}/${total}` : `BocadO · Carta · ${num}`;
  p.drawText(label, {
    x: MARGIN,
    y: 28,
    size: 7,
    font,
    color: GREY,
  });
}
