import { useMemo, useState } from 'react';

interface DishRow {
  id: string;
  slug: string;
  name: string;
  menu_section_id?: string | null;
  images: string[];
}

interface Section {
  id: string;
  title: string;
  emoji?: string;
}

interface Props {
  dishes: DishRow[];
  sections: Section[];
}

export default function DishImagesBoard({ dishes: initial, sections }: Props) {
  const [dishes, setDishes] = useState(initial);
  const [filters, setFilters] = useState({
    q: '',
    section: '',
    type: 'all' as 'all' | 'default' | 'custom' | 'missing',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = dishes.find((d) => d.id === selectedId) ?? null;

  const visible = useMemo(() => {
    return dishes.filter((d) => {
      if (filters.q && !d.name.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.section && d.menu_section_id !== filters.section) return false;
      const img = d.images[0] ?? '';
      const isDefault = img === `/carta/${d.slug}.jpg` || img.startsWith('/carta/') && img.endsWith('.jpg');
      if (filters.type === 'default' && !isDefault) return false;
      if (filters.type === 'custom' && isDefault) return false;
      if (filters.type === 'missing' && img) return false;
      return true;
    });
  }, [dishes, filters]);

  function selectDish(d: DishRow) {
    setSelectedId(d.id);
    setUrlDraft(d.images[0] ?? '');
  }

  async function saveImages(payload: { images?: string[]; use_default?: boolean }) {
    if (!selected) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/dishes/${selected.id}/images`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Error al guardar');
      setDishes((prev) => prev.map((d) => (d.id === data.dish.id ? { ...d, images: data.dish.images } : d)));
      setUrlDraft(data.dish.images[0] ?? '');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function onFile(files: FileList | null) {
    if (!files?.[0] || !selected) return;
    const file = files[0];
    if (file.size > 2_000_000) {
      alert('Máximo 2 MB por imagen');
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
    await saveImages({ images: [dataUrl] });
  }

  return (
    <section className="admin-content space-y-6 !py-0">
      <div className="admin-frame p-4 md:p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-bocado-ink">Filtros de imágenes</h2>
          <p className="text-sm text-bocado-mute mt-1">
            Filtra platos y edita la foto que se muestra en la carta, el PDF y el detalle.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className="input w-full sm:w-64"
            placeholder="Buscar por nombre…"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <select
            className="chip min-w-[160px]"
            value={filters.section}
            onChange={(e) => setFilters({ ...filters, section: e.target.value })}
          >
            <option value="">Todas las secciones</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.title}
              </option>
            ))}
          </select>
          <select
            className="chip min-w-[180px]"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as typeof filters.type })}
          >
            <option value="all">Tipo: todas</option>
            <option value="default">Ruta estándar /carta/</option>
            <option value="custom">URL o subida personalizada</option>
            <option value="missing">Sin imagen</option>
          </select>
          <span className="text-sm text-bocado-mute self-center ml-auto">{visible.length} platos</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="admin-frame p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((d) => {
              const active = selectedId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => selectDish(d)}
                  className={`text-left rounded-2xl border p-3 transition-all hover:shadow-md ${
                    active ? 'border-bocado-ink ring-2 ring-bocado-ink/20' : 'border-bocado-line'
                  }`}
                >
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-bocado-paper2 mb-2">
                    {d.images[0] ? (
                      <img src={d.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xs text-bocado-mute">Sin imagen</div>
                    )}
                  </div>
                  <p className="font-medium text-sm text-bocado-ink line-clamp-2">{d.name}</p>
                  <p className="text-[10px] text-bocado-mute mt-1 truncate">{d.images[0] || '—'}</p>
                </button>
              );
            })}
          </div>
          {visible.length === 0 && (
            <p className="text-center text-bocado-mute py-12">Ningún plato coincide con los filtros.</p>
          )}
        </div>

        <aside className="admin-frame p-4 lg:sticky lg:top-4 space-y-4">
          <h3 className="font-semibold text-bocado-ink">Editar imagen</h3>
          {!selected ? (
            <p className="text-sm text-bocado-mute">Selecciona un plato de la lista.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-bocado-ink">{selected.name}</p>
              <p className="text-xs text-bocado-mute">Slug: {selected.slug}</p>
              <div className="aspect-video rounded-xl overflow-hidden bg-bocado-paper2 border border-bocado-line">
                {urlDraft ? (
                  <img src={urlDraft} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-bocado-mute text-sm">Vista previa</div>
                )}
              </div>
              <label className="block text-xs font-medium text-bocado-mute">URL de imagen</label>
              <input
                className="input text-sm"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://… o /carta/plato.jpg"
              />
              <button
                type="button"
                className="btn-primary w-full text-sm"
                disabled={saving || !urlDraft.trim()}
                onClick={() => saveImages({ images: [urlDraft.trim()] })}
              >
                {saving ? 'Guardando…' : 'Guardar URL'}
              </button>
              <label className="block text-xs font-medium text-bocado-mute">Subir archivo</label>
              <input
                type="file"
                accept="image/*"
                className="input text-sm file:mr-2 file:rounded-full file:border-0 file:bg-bocado-lime file:px-3 file:py-1.5 file:text-xs"
                onChange={(e) => onFile(e.target.files)}
              />
              <button
                type="button"
                className="btn-ghost w-full text-sm"
                disabled={saving}
                onClick={() => saveImages({ use_default: true })}
              >
                Usar imagen estándar (/carta/{selected.slug}.jpg)
              </button>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
