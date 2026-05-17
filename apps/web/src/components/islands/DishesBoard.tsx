import { useState } from 'react';

const eur = (c: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100);

const ALLERGENS = [
  'gluten', 'lacteos', 'huevos', 'pescado', 'crustaceos', 'moluscos',
  'cacahuetes', 'frutos_secos', 'soja', 'apio', 'mostaza', 'sesamo', 'sulfitos', 'altramuces',
] as const;
const ALLERGEN_LABEL: Record<string, string> = {
  gluten: 'Gluten', lacteos: 'Lácteos', huevos: 'Huevos', pescado: 'Pescado',
  crustaceos: 'Crustáceos', moluscos: 'Moluscos', cacahuetes: 'Cacahuetes',
  frutos_secos: 'Frutos secos', soja: 'Soja', apio: 'Apio', mostaza: 'Mostaza',
  sesamo: 'Sésamo', sulfitos: 'Sulfitos', altramuces: 'Altramuces',
};
const CATEGORIES = ['starter', 'main', 'dessert', 'drink', 'side'];

interface Props {
  initialDishes: any[];
  restaurants: { id: string; name: string }[];
  menuSections: { id: string; title: string; emoji?: string }[];
}

export default function DishesBoard({ initialDishes, restaurants, menuSections }: Props) {
  const [dishes, setDishes] = useState<any[]>(initialDishes);
  const [filter, setFilter] = useState<{ q: string; cat: string; avail: string }>({ q: '', cat: '', avail: '' });
  const [drawer, setDrawer] = useState(false);
  const [form, setForm] = useState<any>(emptyForm(restaurants[0]?.id, menuSections[0]?.id));

  const visible = dishes.filter((d) => {
    if (filter.q && !d.name.toLowerCase().includes(filter.q.toLowerCase())) return false;
    if (filter.cat && d.category !== filter.cat) return false;
    if (filter.avail === 'yes' && !d.is_available) return false;
    if (filter.avail === 'no' && d.is_available) return false;
    return true;
  });

  async function toggle(d: any) {
    const v = !d.is_available;
    setDishes((prev) => prev.map((x) => (x.id === d.id ? { ...x, is_available: v } : x)));
    await fetch(`/api/dishes/${d.id}/availability`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ available: v }),
    });
  }
  async function dup(d: any) {
    const r = await fetch(`/api/dishes/${d.id}/duplicate`, { method: 'POST' });
    const data = await r.json();
    if (data.dish) setDishes((prev) => [data.dish, ...prev]);
  }
  async function del(d: any) {
    if (!confirm(`¿Eliminar “${d.name}”?`)) return;
    await fetch(`/api/dishes/${d.id}`, { method: 'DELETE' });
    setDishes((prev) => prev.filter((x) => x.id !== d.id));
  }
  function openNew() {
    setForm(emptyForm(restaurants[0]?.id, menuSections[0]?.id));
    setDrawer(true);
  }
  function openEdit(d: any) {
    setForm({
      ...d,
      _price_eur: (d.price_cents / 100).toFixed(2),
      _images_str: d.images.join('\n'),
      _ingredients_str: d.ingredients.join(', '),
      content_sections: d.content_sections ?? [],
    });
    setDrawer(true);
  }

  function readImageFile(file: File) {
    return new Promise<string>((resolve, reject) => {
      if (file.size > 2_000_000) {
        reject(new Error('Máximo 2 MB por imagen'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
      reader.readAsDataURL(file);
    });
  }

  async function onImageFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await readImageFile(f));
      const prev = String(form._images_str ?? form.images?.join('\n') ?? '')
        .split(/\s+/)
        .filter(Boolean);
      setForm({ ...form, _images_str: [...prev, ...urls].join('\n') });
    } catch (err: any) {
      alert(err.message ?? 'Error al subir');
    }
  }

  function addContentSection() {
    const sections = [...(form.content_sections ?? [])];
    sections.push({ id: `sec-${Date.now()}`, title: 'Nueva sección', body: '' });
    setForm({ ...form, content_sections: sections });
  }

  function updateContentSection(id: string, patch: { title?: string; body?: string }) {
    const sections = (form.content_sections ?? []).map((s: any) => (s.id === id ? { ...s, ...patch } : s));
    setForm({ ...form, content_sections: sections });
  }

  function removeContentSection(id: string) {
    setForm({ ...form, content_sections: (form.content_sections ?? []).filter((s: any) => s.id !== id) });
  }
  async function save() {
    const payload = {
      ...form,
      price_cents: Math.round(parseFloat(form._price_eur ?? '0') * 100) || 0,
      images: String(form._images_str ?? '').split(/\s+/).filter(Boolean),
      ingredients: String(form._ingredients_str ?? '').split(',').map((s: string) => s.trim()).filter(Boolean),
    };
    delete payload._price_eur; delete payload._images_str; delete payload._ingredients_str;
    const r = await fetch('/api/dishes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (data.dish) {
      setDishes((prev) => {
        const i = prev.findIndex((x) => x.id === data.dish.id);
        if (i >= 0) { const c = [...prev]; c[i] = data.dish; return c; }
        return [data.dish, ...prev];
      });
      setDrawer(false);
    }
  }
  function toggleAllergen(a: string) {
    const list: string[] = form.allergens ?? [];
    setForm({ ...form, allergens: list.includes(a) ? list.filter((x) => x !== a) : [...list, a] });
  }

  return (
    <section className="admin-content space-y-6 !py-0">
      <div className="flex flex-wrap items-center gap-2">
        <input className="input w-72" placeholder="Buscar plato…" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
        <select className="chip" value={filter.cat} onChange={(e) => setFilter({ ...filter, cat: e.target.value })}>
          <option value="">Categoría: todas</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="chip" value={filter.avail} onChange={(e) => setFilter({ ...filter, avail: e.target.value })}>
          <option value="">Disponibilidad: todas</option>
          <option value="yes">Disponibles</option>
          <option value="no">Agotados</option>
        </select>
        <button className="btn-primary ml-auto" onClick={openNew}>
          <span className="text-bocado-lime text-lg leading-none">+</span> Nuevo plato
        </button>
      </div>

      <div className="admin-frame overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Plato</th>
              <th>Sección</th>
              <th>Precio</th>
              <th>Alérgenos</th>
              <th>On</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="flex items-center gap-2 min-w-0">
                    {d.images?.[0] && <img src={d.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />}
                                        <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{d.name}</div>
                      <div className="text-[10px] text-bocado-mute truncate">{d.cuisine}</div>
                    </div>
                  </div>
                </td>
                <td className="text-xs">{menuSections.find((s) => s.id === d.menu_section_id)?.title ?? '—'}</td>
                <td className="font-medium text-sm whitespace-nowrap">{eur(d.price_cents)}</td>
                <td className="text-[10px] text-bocado-mute">{d.allergens?.length ?? 0}</td>
                <td>
                  <button type="button" onClick={() => toggle(d)} className={`w-9 h-5 rounded-full relative transition ${d.is_available ? 'bg-bocado-lime' : 'bg-bocado-line'}`} aria-label="Disponibilidad">
                    <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white border transition ${d.is_available ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="text-right whitespace-nowrap">
                  <button type="button" className="btn-ghost text-[11px]" onClick={() => openEdit(d)}>Editar</button>
                  <a className="btn-ghost text-[11px]" href={`/platos/${d.slug}`} target="_blank" rel="noreferrer">Ver</a>
                </td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-bocado-mute">Sin resultados.</td></tr>}
          </tbody>
        </table>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[560px] bg-bocado-paper border-l border-bocado-line shadow-2xl flex flex-col">
            <header className="h-[72px] flex items-center justify-between px-6 border-b border-bocado-line">
              <h2 className="text-lg font-semibold tracking-tight">{form.id ? 'Editar plato' : 'Nuevo plato'}</h2>
              <button onClick={() => setDrawer(false)} className="w-9 h-9 rounded-full hover:bg-bocado-ink/5">✕</button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <Section title="Información básica" open>
                <Field label="Nombre"><input className="input" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Descripción corta"><input className="input" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                <Field label="Descripción completa"><textarea rows={3} className="input" value={form.long_description ?? ''} onChange={(e) => setForm({ ...form, long_description: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Restaurante">
                    <select className="input" value={form.restaurant_id} onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}>
                      {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Categoría">
                    <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Sección del menú">
                    <select className="input" value={form.menu_section_id ?? ''} onChange={(e) => setForm({ ...form, menu_section_id: e.target.value })}>
                      {menuSections.map((s) => (
                        <option key={s.id} value={s.id}>{s.emoji} {s.title}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Cocina"><input className="input" value={form.cuisine ?? ''} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} /></Field>
                  <Field label="Ración"><input className="input" value={form.portion ?? ''} onChange={(e) => setForm({ ...form, portion: e.target.value })} /></Field>
                </div>
              </Section>

              <Section title="Precio y tiempos" open>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Precio (€)"><input type="number" step="0.01" className="input" value={form._price_eur ?? (form.price_cents / 100).toFixed(2)} onChange={(e) => setForm({ ...form, _price_eur: e.target.value })} /></Field>
                  <Field label="IVA">
                    <select className="input" value={form.vat_rate ?? 0.1} onChange={(e) => setForm({ ...form, vat_rate: parseFloat(e.target.value) })}>
                      <option value={0.10}>10%</option>
                      <option value={0.21}>21%</option>
                    </select>
                  </Field>
                  <Field label="Entrega (min)"><input type="number" className="input" value={form.delivery_time_min ?? 25} onChange={(e) => setForm({ ...form, delivery_time_min: parseInt(e.target.value, 10) })} /></Field>
                </div>
              </Section>

              <Section title="Información nutricional">
                <div className="grid grid-cols-4 gap-3">
                  <Field label="Kcal"><input type="number" className="input" value={form.nutrition?.kcal ?? 0} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, kcal: parseInt(e.target.value, 10) } })} /></Field>
                  <Field label="Proteína g"><input type="number" className="input" value={form.nutrition?.protein_g ?? 0} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, protein_g: parseInt(e.target.value, 10) } })} /></Field>
                  <Field label="Carbos g"><input type="number" className="input" value={form.nutrition?.carbs_g ?? 0} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, carbs_g: parseInt(e.target.value, 10) } })} /></Field>
                  <Field label="Grasas g"><input type="number" className="input" value={form.nutrition?.fat_g ?? 0} onChange={(e) => setForm({ ...form, nutrition: { ...form.nutrition, fat_g: parseInt(e.target.value, 10) } })} /></Field>
                </div>
              </Section>

              <Section title="Ingredientes">
                <Field label="Lista (separados por comas)"><textarea rows={2} className="input" value={form._ingredients_str ?? form.ingredients?.join(', ') ?? ''} onChange={(e) => setForm({ ...form, _ingredients_str: e.target.value })} /></Field>
              </Section>

              <Section title="Alérgenos (Reglamento UE 1169/2011)" open>
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS.map((a) => {
                    const on = (form.allergens ?? []).includes(a);
                    return (
                      <button key={a} type="button" onClick={() => toggleAllergen(a)}
                              className={`chip ${on ? '!bg-bocado-ink !text-white !border-bocado-ink' : ''}`}>
                        {ALLERGEN_LABEL[a]}
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="Imágenes">
                <Field label="Subir desde tu dispositivo">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="input text-sm file:mr-3 file:rounded-full file:border-0 file:bg-bocado-lime file:px-4 file:py-2 file:text-sm file:font-medium"
                    onChange={(e) => onImageFiles(e.target.files)}
                  />
                  <p className="text-xs text-bocado-mute mt-1">Demo: se guardan en base64 (máx. 2 MB). También puedes pegar URLs.</p>
                </Field>
                {(form._images_str ?? form.images?.join('\n') ?? '').split(/\s+/).filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {String(form._images_str ?? form.images?.join('\n') ?? '')
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((url: string, i: number) => (
                        <img key={i} src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-bocado-line" />
                      ))}
                  </div>
                )}
                <Field label="URLs (una por línea)">
                  <textarea rows={3} className="input" value={form._images_str ?? form.images?.join('\n') ?? ''} onChange={(e) => setForm({ ...form, _images_str: e.target.value })} />
                </Field>
              </Section>

              <Section title="Secciones del detalle (página del plato)">
                <p className="text-xs text-bocado-mute mb-3">Bloques extra: origen, maridaje, consejos del chef, etc.</p>
                <div className="space-y-3">
                  {(form.content_sections ?? []).map((sec: any) => (
                    <div key={sec.id} className="card-static p-4 space-y-2">
                      <div className="flex gap-2">
                        <input
                          className="input flex-1 text-sm"
                          placeholder="Título"
                          value={sec.title}
                          onChange={(e) => updateContentSection(sec.id, { title: e.target.value })}
                        />
                        <button type="button" className="btn-ghost text-xs text-red-600 shrink-0" onClick={() => removeContentSection(sec.id)}>
                          Quitar
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        className="input text-sm"
                        placeholder="Contenido"
                        value={sec.body}
                        onChange={(e) => updateContentSection(sec.id, { body: e.target.value })}
                      />
                    </div>
                  ))}
                  <button type="button" className="btn-ghost text-sm w-full" onClick={addContentSection}>
                    + Añadir sección
                  </button>
                </div>
              </Section>

              <Section title="Disponibilidad y etiquetas">
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} /> Disponible ahora</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Destacado</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.vegan} onChange={(e) => setForm({ ...form, vegan: e.target.checked })} /> Vegano</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.vegetarian} onChange={(e) => setForm({ ...form, vegetarian: e.target.checked })} /> Vegetariano</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.gluten_free} onChange={(e) => setForm({ ...form, gluten_free: e.target.checked })} /> Sin gluten</label>
                </div>
              </Section>
            </div>
            <footer className="border-t border-bocado-line p-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setDrawer(false)}>Cancelar</button>
              <button className="btn-lime" onClick={save}>Guardar plato</button>
            </footer>
          </aside>
        </div>
      )}
    </section>
  );
}

function Section({ title, open, children }: { title: string; open?: boolean; children: any }) {
  return (
    <details open={open} className="card p-5">
      <summary className="cursor-pointer font-medium select-none">{title}</summary>
      <div className="mt-4 space-y-3">{children}</div>
    </details>
  );
}
function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function emptyForm(restaurant_id?: string, menu_section_id?: string) {
  return {
    restaurant_id: restaurant_id ?? '',
    menu_section_id: menu_section_id ?? '',
    name: '',
    description: '',
    long_description: '',
    category: 'main',
    cuisine: 'Mediterránea',
    _price_eur: '9.90',
    price_cents: 990,
    vat_rate: 0.10,
    delivery_time_min: 25,
    portion: '1 ración',
    images: [],
    _images_str: '',
    ingredients: [],
    _ingredients_str: '',
    allergens: [],
    nutrition: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    is_available: true,
    is_featured: false,
    vegan: false,
    vegetarian: false,
    gluten_free: false,
    content_sections: [],
  };
}
