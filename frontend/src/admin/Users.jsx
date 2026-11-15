import { useState } from 'react';
import { Lock, Search, Unlock } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useDebounced, useFetch } from '../lib/hooks.js';
import { Alert, Avatar, Empty, ErrorBox, Pagination, Select, Spinner } from '../components/ui.jsx';
import { formatNumber, formatShortDate } from '../lib/format.js';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [f, setF] = useState({ q: '', role: '', status: '', sort: 'new' });
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState({ type: 'success', text: '' });
  const q = useDebounced(f.q);
  const res = useFetch(() => api('/admin/users', { params: { ...f, q, page } }), [q, f.role, f.status, f.sort, page]);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };

  const patch = async (u, body, text) => {
    try { await api(`/admin/users/${u.id}`, { method: 'PATCH', body }); setMsg({ type: 'success', text }); res.reload(); }
    catch (e) { setMsg({ type: 'error', text: e.message }); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input className="input pl-9" placeholder="Поиск по имени или email" value={f.q} onChange={set('q')} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[620px]">
          <div><label className="label">Роль</label><Select value={f.role} onChange={set('role')}><option value="">Все роли</option><option value="user">Пользователь</option><option value="admin">Администратор</option></Select></div>
          <div><label className="label">Статус</label><Select value={f.status} onChange={set('status')}><option value="">Все статусы</option><option value="active">Активен</option><option value="blocked">Заблокирован</option></Select></div>
          <div><label className="label">Сортировка</label><Select value={f.sort} onChange={set('sort')}><option value="new">Сначала новые</option><option value="old">Сначала старые</option><option value="name">По имени</option></Select></div>
        </div>
      </div>
      <Alert type={msg.type}>{msg.text}</Alert>

      {res.error ? <ErrorBox error={res.error} onRetry={res.reload} /> : !res.data ? <Spinner /> : res.data.data.length === 0 ? <div className="card"><Empty title="Пользователи не найдены" /></div> : (
        <div className={`card overflow-x-auto ${res.loading ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="table-head"><tr>{['Пользователь', 'Email', 'Роль', 'Регистрация', 'Статей', 'Статус', 'Действия'].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {res.data.data.map((u) => {
                const self = u.id === me.id;
                return (
                  <tr key={u.id} className="border-t border-line">
                    <td className="px-5 py-3"><span className="flex items-center gap-3"><Avatar name={u.name} size="sm" /><span><b className="block font-medium">{u.name}</b><span className="text-xs text-subtle">ID {u.id}</span></span></span></td>
                    <td className="px-5 py-3">{u.email}</td>
                    <td className="px-5 py-3">
                      <select aria-label="Роль" disabled={self} value={u.role} onChange={(e) => patch(u, { role: e.target.value }, 'Роль изменена.')}
                        className={`rounded-md px-2 py-1 text-xs font-medium outline-none ${u.role === 'admin' ? 'bg-accent-soft text-accent' : 'bg-alt text-muted'}`}>
                        <option value="user">Пользователь</option><option value="admin">Администратор</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-muted">{formatShortDate(u.created_at)}</td>
                    <td className="px-5 py-3">{formatNumber(u.posts_count)}</td>
                    <td className="px-5 py-3"><span className={`badge ${u.is_blocked ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'}`}>{u.is_blocked ? 'Заблокирован' : 'Активен'}</span></td>
                    <td className="px-5 py-3">
                      <button disabled={self} className={u.is_blocked ? 'icon-btn text-success' : 'icon-btn-danger'} aria-label={u.is_blocked ? 'Разблокировать' : 'Заблокировать'} title={self ? 'Нельзя изменить себя' : u.is_blocked ? 'Разблокировать' : 'Заблокировать доступ'}
                        onClick={() => patch(u, { is_blocked: !u.is_blocked }, u.is_blocked ? 'Доступ восстановлен.' : 'Пользователь заблокирован.')}>
                        {u.is_blocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {res.data && <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted sm:flex-row"><span>Всего {formatNumber(res.data.meta.total)}</span><Pagination meta={res.data.meta} onPage={setPage} /></div>}
    </div>
  );
}
