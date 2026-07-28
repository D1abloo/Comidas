import { useState } from 'react';

interface UserRow { id: string; email: string; full_name: string; role: 'admin' | 'customer' | 'courier'; created_at: string }

export default function UsersBoard({ initialUsers, selfId }: { initialUsers: UserRow[]; selfId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState<'all' | 'admin' | 'customer' | 'courier'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const list = filter === 'all' ? users : users.filter((u) => u.role === filter);

  async function setRole(id: string, role: 'admin' | 'customer' | 'courier') {
    if (busyId) return;
    const current = users.find((user) => user.id === id);
    if (!current || current.role === role) return;
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.user) {
        const messages: Record<string, string> = {
          cannot_change_own_role: 'No puedes cambiar tu propio rol.',
          last_admin_required: 'Debe quedar al menos un administrador.',
          not_found: 'El usuario ya no existe.',
        };
        throw new Error(messages[data.error] ?? 'No se pudo cambiar el rol.');
      }
      setUsers((list) => list.map((user) => (user.id === id ? { ...user, role: data.user.role } : user)));
      setNotice(`Rol de ${current.full_name} actualizado.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el rol.');
    } finally {
      setBusyId(null);
    }
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar usuario?')) return;
    const current = users.find((user) => user.id === id);
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const messages: Record<string, string> = {
          cannot_delete_self: 'No puedes eliminar tu propia cuenta.',
          last_admin_required: 'Debe quedar al menos un administrador.',
          not_found: 'El usuario ya no existe.',
        };
        throw new Error(messages[data.error] ?? 'No se pudo eliminar el usuario.');
      }
      setUsers((list) => list.filter((user) => user.id !== id));
      setNotice(`${current?.full_name ?? 'Usuario'} eliminado.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el usuario.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? '!bg-bocado-ink !text-white' : ''}`}>Todos</button>
        <button type="button" onClick={() => setFilter('admin')} className={`chip ${filter === 'admin' ? '!bg-bocado-ink !text-white' : ''}`}>Administradores</button>
        <button type="button" onClick={() => setFilter('customer')} className={`chip ${filter === 'customer' ? '!bg-bocado-ink !text-white' : ''}`}>Clientes</button>
        <button type="button" onClick={() => setFilter('courier')} className={`chip ${filter === 'courier' ? '!bg-bocado-ink !text-white' : ''}`}>Repartidores</button>
        <div className="ml-auto text-xs text-bocado-mute">
          Nuevos administradores se crean en <a href="/admin/registro" className="underline">/admin/registro</a>.
        </div>
      </div>
      {(error || notice) && (
        <p
          className={`admin-action-message ${error ? 'admin-action-message--error' : 'admin-action-message--success'}`}
          role={error ? 'alert' : 'status'}
        >
          {error || notice}
        </p>
      )}

      <div className="admin-frame overflow-x-auto">
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
                  <select
                    value={u.role}
                    onChange={(e) => void setRole(u.id, e.target.value as UserRow['role'])}
                    className="chip"
                    disabled={u.id === selfId || busyId === u.id}
                    aria-label={`Rol de ${u.full_name}`}
                  >
                    <option value="customer">Cliente</option>
                    <option value="courier">Repartidor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td className="text-bocado-mute">{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
                <td className="text-right pr-5">
                  <button
                    type="button"
                    className="btn-ghost text-xs text-red-600"
                    disabled={u.id === selfId || busyId === u.id}
                    onClick={() => void del(u.id)}
                    aria-busy={busyId === u.id}
                  >
                    {busyId === u.id ? 'Procesando…' : 'Eliminar'}
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
