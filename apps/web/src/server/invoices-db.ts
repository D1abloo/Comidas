import { randomUUID } from 'node:crypto';
import { pgQuery, withPgTransaction } from './pg.js';
import type { Invoice } from './types.js';

function normalizeInvoice(row: Invoice): Invoice {
  return {
    ...row,
    issued_at: new Date(row.issued_at).toISOString(),
  };
}

export async function pgGetInvoice(id: string): Promise<Invoice | null> {
  const { rows } = await pgQuery<Invoice>('SELECT * FROM invoices WHERE id = $1', [id]);
  return rows[0] ? normalizeInvoice(rows[0]) : null;
}

export async function pgListInvoices(): Promise<Invoice[]> {
  const { rows } = await pgQuery<Invoice>('SELECT * FROM invoices ORDER BY issued_at DESC');
  return rows.map(normalizeInvoice);
}

export async function pgCreateInvoice(
  draft: Omit<Invoice, 'id' | 'number' | 'issued_at'>,
  prefix: string,
): Promise<Invoice> {
  return withPgTransaction(async (client) => {
    const existing = await client.query<Invoice>(
      'SELECT * FROM invoices WHERE order_id = $1 FOR UPDATE',
      [draft.order_id],
    );
    if (existing.rows[0]) return normalizeInvoice(existing.rows[0]);

    const year = new Date().getFullYear();
    const counter = await client.query<{ last_number: number }>(
      `INSERT INTO invoice_counters (year, prefix, last_number) VALUES ($1, $2, 1)
       ON CONFLICT (year, prefix)
       DO UPDATE SET last_number = invoice_counters.last_number + 1
       RETURNING last_number`,
      [year, prefix],
    );
    const sequence = counter.rows[0]?.last_number ?? 1;
    const invoice: Invoice = {
      ...draft,
      id: randomUUID(),
      number: `${prefix}-${year}-${String(sequence).padStart(6, '0')}`,
      issued_at: new Date().toISOString(),
    };
    await client.query(
      `INSERT INTO invoices (
        id, number, order_id, order_number, customer_name, customer_tax_id,
        customer_address, lines, subtotal_cents, vat_cents, total_cents,
        payment_method, payment_status, issued_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        invoice.id,
        invoice.number,
        invoice.order_id,
        invoice.order_number ?? null,
        invoice.customer_name,
        invoice.customer_tax_id,
        JSON.stringify(invoice.customer_address),
        JSON.stringify(invoice.lines),
        invoice.subtotal_cents,
        invoice.vat_cents,
        invoice.total_cents,
        invoice.payment_method,
        invoice.payment_status,
        invoice.issued_at,
      ],
    );
    await client.query('UPDATE orders SET invoice_id = $2, updated_at = NOW() WHERE id = $1', [
      invoice.order_id,
      invoice.id,
    ]);
    return invoice;
  });
}
