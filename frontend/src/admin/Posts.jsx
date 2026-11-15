import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Search, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useDebounced, useFetch } from '../lib/hooks.js';
import { Alert, Avatar, Empty, ErrorBox, Pagination, Select, Spinner } from '../components/ui.jsx';
import { STATUS, formatShortDate, formatNumber } from '../lib/format.js';
import { useConfirm } from '../components/Confirm.jsx';

export default function AdminPosts() {
  const [f, setF] = useState({ q: '', category_id: '', status: '', sort: 'new' });
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState({ type: 'success', text: '' });
  const confirm = useConfirm();
  const q = useDebounced(f.q);
  const cats = useFetch(() => api('/categories'), []);
  const res = useFetch(() => api('/admin/posts', { params: { ...f, q, page } }), [q, f.category_id, f.status, f.sort, page]);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };

  const changeStatus = async (p, status) => {
    try { await api(`/admin/posts/${p.id}`, { method: 'PATCH', body: { status } }); setMsg({ type: 'success', text: 'Статус обновлён.' }); res.reload(); }
    catch (e) { setMsg({ type: 'error', text: e.message }); }
  };
  const remove = async (p) => {
    const ok = await confirm({
      title: `Удалить публикацию «${p.title}»?`,
      text: 'Вместе с ней удалятся все комментарии и лайки. Действие нельзя отменить.',
    });
    if (!ok) return;
    try { await api(`/admin/posts/${p.id}`, { method: 'DELETE' }); setMsg({ type: 'success', text: 'Публикация удалена.' }); res.reload(); }
    catch (e) { setMsg({ type: 'error', text: e.message }); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input className="input pl-9" placeholder="Поиск по названию или автору" value={f.q} onChange={set('q')} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[620px]">
          <div><label className="label">Категория</label><Select value={f.category_id} onChange={set('category_id')}><option value="">Все категории</option>{cats.data?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
          <div><label className="label">Статус</label><Select value={f.status} onChange={set('status')}><option value="">Все статусы</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></div>
          <div><label className="label">Сортировка</label><Select value={f.sort} onChange={set('sort')}><option value="new">Сначала новые</option><option value="old">Сначала старые</option><option value="popular">По лайкам</option></Select></div>
        </div>
        <Link to="/cabinet/posts/new" className="btn-primary">+ Создать</Link>
      </div>
      <Alert type={msg.type}>{msg.text}</Alert>

      {res.error ? <ErrorBox error={res.error} onRetry={res.reload} /> : !res.data ? <Spinner /> : res.data.data.length === 0 ? <div className="card"><Empty title="Публикации не найдены" /></div> : (
        <div className={`card overflow-x-auto ${res.loading ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="table-head"><tr>{['Название', 'Автор', 'Категория', 'Создано', 'Статус', 'Лайки', 'Действия'].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {res.data.data.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="max-w-[300px] px-5 py-3"><p className="font-medium leading-snug">{p.title}</p><p className="text-xs text-subtle">ID {p.id}</p></td>
                  <td className="px-5 py-3"><span className="flex items-center gap-2"><Avatar name={p.author?.name} size="xs" />{p.author?.name}</span></td>
                  <td className="px-5 py-3">{p.category?.name}</td>
                  <td className="px-5 py-3 text-muted">{formatShortDate(p.created_at)}</td>
                  <td className="px-5 py-3">
                    <select aria-label="Статус" value={p.status} onChange={(e) => changeStatus(p, e.target.value)} className={`badge cursor-pointer border-0 py-1 pr-2 outline-none ${STATUS[p.status].cls}`}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-muted">{formatNumber(p.likes_count)}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link to={`/articles/${p.id}`} className="icon-btn" aria-label="Открыть"><Eye className="h-4 w-4" /></Link>
                      <Link to={`/cabinet/posts/${p.id}/edit`} className="icon-btn" aria-label="Редактировать"><Pencil className="h-4 w-4" /></Link>
                      <button className="icon-btn-danger" aria-label="Удалить" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {res.data && (
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted sm:flex-row">
          <span>Всего: {formatNumber(res.data.meta.total)}</span><Pagination meta={res.data.meta} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
