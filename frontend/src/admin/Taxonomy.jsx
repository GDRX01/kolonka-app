import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useFetch } from '../lib/hooks.js';
import { Alert, ErrorBox, Spinner } from '../components/ui.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import { formatNumber, plural } from '../lib/format.js';

/** One editable row, used for both categories and tags. */
function Row({ item, prefix = '', showSlug, onSave, onDelete }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(item.name);
  const save = async () => { if (await onSave(item, name)) setEdit(false); };

  return (
    <tr className={`border-t border-line ${edit ? 'bg-accent-soft' : ''}`}>
      <td className="px-5 py-3">
        {edit ? (
          <span className="flex items-center gap-2">
            <input autoFocus className="input w-44 py-1.5" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
            <button className="icon-btn bg-accent text-white hover:bg-accent-hover hover:text-white" onClick={save} aria-label="Сохранить"><Check className="h-4 w-4" /></button>
            <button className="icon-btn" onClick={() => { setEdit(false); setName(item.name); }} aria-label="Отмена"><X className="h-4 w-4" /></button>
          </span>
        ) : prefix ? <span className="chip">{prefix}{item.name}</span> : item.name}
      </td>
      {showSlug && <td className="px-5 py-3 text-muted">{item.slug}</td>}
      <td className="px-5 py-3">{formatNumber(item.posts_count)}</td>
      <td className="px-5 py-3">
        <div className="flex justify-end gap-2">
          <button className="icon-btn" onClick={() => setEdit(true)} aria-label="Редактировать"><Pencil className="h-4 w-4" /></button>
          <button className="icon-btn-danger" onClick={() => onDelete(item)} aria-label="Удалить"><Trash2 className="h-4 w-4" /></button>
        </div>
      </td>
    </tr>
  );
}

function Panel({ title, count, placeholder, resource, prefix, showSlug, items, reload, extra, setMsg }) {
  const [name, setName] = useState('');
  const confirm = useConfirm();

  const add = async () => {
    if (!name.trim()) return;
    try { await api(`/admin/${resource}`, { method: 'POST', body: { name } }); setName(''); setMsg({ type: 'success', text: 'Добавлено.' }); reload(); }
    catch (e) { setMsg({ type: 'error', text: e.first?.('name') || e.message }); }
  };
  const save = async (item, newName) => {
    try { await api(`/admin/${resource}/${item.id}`, { method: 'PUT', body: { name: newName } }); setMsg({ type: 'success', text: 'Сохранено.' }); reload(); return true; }
    catch (e) { setMsg({ type: 'error', text: e.first?.('name') || e.message }); return false; }
  };
  const del = async (item) => {
    const isTag = resource === 'tags';
    const n = item.posts_count || 0;
    const ok = await confirm({
      title: `Удалить ${isTag ? 'тег' : 'категорию'} «${prefix}${item.name}»?`,
      text: isTag && n
        ? `Тег снимется с ${formatNumber(n)} ${plural(n, ['публикации', 'публикаций', 'публикаций'])}. Действие нельзя отменить.`
        : 'Действие нельзя отменить.',
    });
    if (!ok) return;
    try { await api(`/admin/${resource}/${item.id}`, { method: 'DELETE' }); setMsg({ type: 'success', text: 'Удалено.' }); reload(); }
    catch (e) { setMsg({ type: 'error', text: e.message }); }
  };

  return (
    <section className="card overflow-hidden">
      <div className="space-y-4 p-5">
        <h2 className="text-xl font-medium">{title} <span className="ml-1 text-xs font-normal text-subtle">{count}</span></h2>
        <div className="flex gap-3">
          <input className="input" placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn-primary" onClick={add}>Добавить</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="table-head"><tr>
            <th className="px-5 py-3 font-semibold">{showSlug ? 'Название' : 'Тег'}</th>
            {showSlug && <th className="px-5 py-3 font-semibold">Slug</th>}
            <th className="px-5 py-3 font-semibold">Публикаций</th><th />
          </tr></thead>
          <tbody>{items.map((it) => <Row key={it.id} item={it} prefix={prefix} showSlug={showSlug} onSave={save} onDelete={del} />)}</tbody>
        </table>
      </div>
      {extra}
    </section>
  );
}

export default function Taxonomy() {
  const [all, setAll] = useState(false);
  const [msg, setMsg] = useState({ type: 'success', text: '' });
  const cats = useFetch(() => api('/admin/categories'), []);
  const tags = useFetch(() => api('/admin/tags', { params: { limit: all ? 500 : 8 } }), [all]);

  if (cats.error || tags.error) return <ErrorBox error={cats.error || tags.error} onRetry={() => { cats.reload(); tags.reload(); }} />;
  if (!cats.data || !tags.data) return <Spinner />;

  return (
    <div className="space-y-5">
      <Alert type={msg.type}>{msg.text}</Alert>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Panel title="Категории" count={`${cats.data.data.length} ${plural(cats.data.data.length, ['категория', 'категории', 'категорий'])}`}
          placeholder="Название новой категории" resource="categories" prefix="" showSlug items={cats.data.data} reload={cats.reload} setMsg={setMsg} />
        <Panel title="Теги" count={`${tags.data.total} ${plural(tags.data.total, ['тег', 'тега', 'тегов'])}`}
          placeholder="Новый тег, например #docker" resource="tags" prefix="#" items={tags.data.data} reload={tags.reload} setMsg={setMsg}
          extra={tags.data.total > 8 && (
            <button className="w-full border-t border-line py-3 text-sm font-medium text-accent hover:bg-alt" onClick={() => setAll(!all)}>
              {all ? 'Свернуть' : `Показать все ${tags.data.total} ${plural(tags.data.total, ['тег', 'тега', 'тегов'])}`}
            </button>
          )} />
      </div>
    </div>
  );
}
