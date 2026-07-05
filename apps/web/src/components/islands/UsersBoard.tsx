import { useState } from 'react';

interface UserRow { id: string; email: string; full_name: string; role: 'admin' | 'customer' | 'courier'; created_at: string }

export default function UsersBoard({ initialUsers, selfId }: { initialUsers: UserRow[]; selfId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState<'all' | 'admin' | 'customer' | 'courier'>('all');
  const list = filter === 'all' ? users : users.filter((u) => u.role === filter);

  async function setRole(id: string, role: 'admin' | 'customer' | 'courier') {
    setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
    await fetch(`/api/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role }),
    });
  }
  async function del(id: string) {
    if (!confirm('¿Eliminar usuario?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    setUsers((p) => p.filter((u) => u.id !== id));
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? '!bg-bocado-ink !text-white' : ''}`}>Todos</button>
        <button onClick={() => setFilter('admin')} className={`chip ${filter === 'admin' ? '!bg-bocado-ink !text-white' : ''}`}>Administradores</button>
        <button onClick={() => setFilter('customer')} className={`chip ${filter === 'customer' ? '!bg-bocado-ink !text-white' : ''}`}>Clientes</button>
        <button onClick={() => setFilter('courier')} className={`chip ${filter === 'courier' ? '!bg-bocado-ink !text-white' : ''}`}>Repartidores</button>
        <div className="ml-auto text-xs text-bocado-mute">
          Nuevos administradores se crean en <a href="/admin/registro" className="underline">/admin/registro</a>.
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bocado-paper2 text-bocado-mute">
            <tr className="text-left">
              <th className="font-normal py-3 px-5">Nombre</th>
              <th className="font-normal">Email</th>
              <th className="font-normal">Rol</th>
              <th className="font-normal">Alta</th>
              <th className="font-normal text-right pr-5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t border-bocado-line">
                <td className="py-3 px-5 font-medium">{u.full_name}{u.id === selfId && <span className="ml-2 chip text-[10px]">tú</span>}</td>
                <td className="text-bocado-mute">{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => setRole(u.id, e.target.value as any)} className="chip" disabled={u.id === selfId}>
                    <option value="customer">Cliente</option>
                    <option value="courier">Repartidor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td className="text-bocado-mute">{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
                <td className="text-right pr-5">
                  <button className="btn-ghost text-xs text-red-600" disabled={u.id === selfId} onClick={() => del(u.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-bocado-mute">Sin usuarios.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
