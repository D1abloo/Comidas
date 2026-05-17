import QRCode from 'qrcode';

export interface BizumInput {
  phone: string;
  amount_cents: number;
  concept: string;
}

export async function generateBizumQR(input: BizumInput) {
  const amount = (input.amount_cents / 100).toFixed(2);
  const concept = encodeURIComponent(input.concept).slice(0, 60);
  const phone = normalizePhone(input.phone);
  const payload = `BIZUM:NUMBER=${phone};AMOUNT=${amount};CONCEPT=${concept}`;
  const dataUrl = await QRCode.toDataURL(payload, {
    margin: 1,
    width: 480,
    errorCorrectionLevel: 'M',
    color: { dark: '#0a0a0a', light: '#ffffff' },
  });
  return { payload, dataUrl, phone, amount };
}

export function normalizePhone(p: string): string {
  const c = p.replace(/[\s().-]/g, '');
  if (c.startsWith('+')) return c;
  if (/^\d{9}$/.test(c)) return `+34${c}`;
  return `+${c}`;
}
