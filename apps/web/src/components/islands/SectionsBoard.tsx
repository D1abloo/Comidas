import { useState } from 'react';

interface Section {
  id: string;
  title: string;
  slug: string;
  description?: string;
  emoji?: string;
  sort_order: number;
  is_active: boolean;
}

export default function SectionsBoard({ initialSections, dishCounts }: { initialSections: Section[]; dishCounts: Record<string, number> }) {
  const [sections, setSections] = useState(initialSections);
  const [form, setForm] = useState<Partial<Section> | null>(null);

  async function save() {
    if (!form?.title?.trim()) return;
    const r = await fetch('/api/sections', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await r.json();
    if (data.section) {
      setSections((prev) => {
        const i = prev.findIndex((s) => s.id === data.section.id);
        if (i >= 0) {
          const c = [...prev];
          c[i] = data.section;
          return c.sort((a, b) => a.sort_order - b.sort_order);
        }
        return [...prev, data.section].sort((a, b) => a.sort_order - b.sort_order);
      });
      setForm(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar sección? Los platos quedarán sin sección.')) return;
    await fetch(`/api/sections/${id}`, { method: 'DELETE' });
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <section className="admin-content space-y-4 !py-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-bocado-mute max-w-xl">
          Organiza el catálogo en bloques visibles en la tienda (estilo Just Eat). Asigna cada plato a una sección al editarlo.
        </p>
        <button type="button" className="btn-lime shrink-0" onClick={() => setForm({ title: '', emoji: '🍽️', sort_order: sections.length + 1, is_active: true })}>
          + Nueva sección
        </button>
      </div>

      <div className="admin-frame">
        <table className="admin-table w-full">
          <thead>
            <tr>
              <th>Sección</th>
              <th>Platos</th>
              <th>Orden</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className="text-lg mr-2">{s.emoji}</span>
                  <span className="font-medium">{s.title}</span>
                  {s.description && <div className="text-xs text-bocado-mute mt-0.5">{s.description}</div>}
                </td>
                <td>{dishCounts[s.id] ?? 0}</td>
                <td>{s.sort_order}</td>
                <td>
                  <span className={`chip text-[10px] ${s.is_active ? '!bg-emerald-50 !text-emerald-800' : ''}`}>
                    {s.is_active ? 'Activa' : 'Oculta'}
                  </span>
                </td>
                <td className="text-right">
                  <button type="button" className="btn-ghost text-xs" onClick={() => setForm({ ...s })}>Editar</button>
                  <button type="button" className="btn-ghost text-xs text-red-600" onClick={() => remove(s.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setForm(null)} />
                    <div className="relative card p-6 w-full max-w-md space-y-4 animate-fade-up">
            <h3 className="text-lg font-semibold">{form.id ? 'Editar sección' : 'Nueva sección'}</h3>
            <label className="block">
              <span className="label">Título</span>
              <input className="input mt-1" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Emoji</span>
              <input className="input mt-1 w-20" value={form.emoji ?? ''} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Descripción</span>
              <input className="input mt-1" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Orden</span>
              <input type="number" className="input mt-1 w-24" value={form.sort_order ?? 1} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Visible en tienda
            </label>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
              <button type="button" className="btn-lime" onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
