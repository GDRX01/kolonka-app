import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { api } from '../lib/api.js';
import { useFetch } from '../lib/hooks.js';
import { Alert, Avatar, Empty, ErrorBox, Pagination, Select, Spinner, StatusBadge } from '../components/ui.jsx';
import { COMPLAINT_STATUS, formatDate, plural, timeAgo } from '../lib/format.js';
import { useConfirm } from '../components/Confirm.jsx';

function Detail({ c, onSaved }) {
  const [status, setStatus] = useState(c.status);
  const [resolution, setResolution] = useState(c.resolution || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: 'success', text: '' });
  const confirm = useConfirm();

  useEffect(() => { setStatus(c.status); setResolution(c.resolution || ''); setMsg({ type: 'success', text: '' }); }, [c.id, c.status, c.resolution]);

  const send = async (body, text) => {
    setBusy(true);
    try { await api(`/admin/complaints/${c.id}`, { method: 'PATCH', body }); setMsg({ type: 'success', text }); onSaved(); }
    catch (e) { setMsg({ type: 'error', text: e.message }); }
    finally { setBusy(false); }
  };

  const hidePost = async () => {
    const ok = await confirm({
      title: `Скрыть публикацию «${c.post?.title}»?`,
      text: 'Она пропадёт с сайта, а жалоба получит статус «Решена». Вернуть публикацию можно в разделе «Публикации».',
      confirmLabel: 'Скрыть',
    });
    if (ok) send({ status: 'resolved', resolution, hide_post: true }, 'Публикация скрыта, жалоба решена.');
  };

  const h = 'mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted';
  return (
    <aside className="card p-5 xl:sticky xl:top-24 xl:self-start">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-2xl font-medium">Жалоба #{c.id}</h2><p className="text-xs text-subtle">Поступила {formatDate(c.created_at)}</p></div>
        <StatusBadge kind="complaint" status={c.status} />
      </div>

      <h3 className={h}>Публикация</h3>
      <div className="rounded-lg bg-alt p-4">
        <p className="font-serif text-lg font-medium leading-snug">{c.post?.title}</p>
        <p className="mt-1 text-xs text-subtle">{c.post?.author?.name} · {c.post?.complaints_count} {plural(c.post?.complaints_count || 0, ['жалоба', 'жалобы', 'жалоб'])}{c.post?.status === 'hidden' ? ' · скрыта' : ''}</p>
        <Link to={`/articles/${c.post?.id}`} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent">Открыть публикацию <ExternalLink className="h-3.5 w-3.5" /></Link>
      </div>

      <h3 className={h}>Отправитель</h3>
      <div className="flex items-center gap-3"><Avatar name={c.sender?.name} /><div className="text-sm"><b>{c.sender?.name}</b><div className="text-muted">{c.sender?.email}</div></div></div>

      <h3 className={h}>Причина обращения</h3>
      <span className="badge bg-accent-soft text-accent">{c.reason_label}</span>
      {c.details && <p className="mt-2 text-sm">{c.details}</p>}

      <div className="mt-5 space-y-4">
        <div><label className="label">Статус рассмотрения</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>{Object.entries(COMPLAINT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></div>
        <div><label className="label">Результат обработки</label>
          <textarea className="input h-24 resize-none" maxLength={1000} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Что было сделано по жалобе" /></div>
        <Alert type={msg.type}>{msg.text}</Alert>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-danger" disabled={busy || c.post?.status === 'hidden'} onClick={hidePost}>Скрыть публикацию</button>
          <button className="btn-outline" disabled={busy} onClick={() => send({ status: 'rejected', resolution }, 'Жалоба отклонена.')}>Отклонить</button>
        </div>
        <button className="btn-primary w-full" disabled={busy} onClick={() => send({ status, resolution }, 'Решение сохранено.')}>Сохранить решение</button>
      </div>
    </aside>
  );
}

export default function Complaints() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const res = useFetch(() => api('/admin/complaints', { params: { status, page } }), [status, page]);

  // keep a valid selection: first row by default; fresh data after saving
  const current = res.data?.data.find((c) => c.id === selected) || res.data?.data[0];
  const counts = res.data?.counts;
  const tabs = [['', 'Все', counts?.all], ['new', 'Новые', counts?.new], ['in_review', 'На рассмотрении', counts?.in_review], ['resolved', 'Решённые', counts?.resolved], ['rejected', 'Отклонённые', counts?.rejected]];

  return (
    <div className="space-y-5">
      <div className="flex gap-5 border-b border-line text-sm">
        {tabs.map(([k, label, n]) => (
          <button key={k} onClick={() => { setStatus(k); setPage(1); setSelected(null); }}
            className={`-mb-px shrink-0 border-b-2 pb-3 font-medium ${status === k ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}>
            {label} <span className="ml-1 rounded-full bg-alt px-2 py-0.5 text-xs font-normal">{n ?? 0}</span>
          </button>
        ))}
      </div>

      {res.error ? <ErrorBox error={res.error} onRetry={res.reload} /> : !res.data ? <Spinner /> : res.data.data.length === 0 ? <div className="card"><Empty title="Жалоб нет">В этой категории пока ничего нет.</Empty></div> : (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="table-head"><tr>{['Публикация', 'Причина', 'Дата', 'Статус'].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody>
                  {res.data.data.map((c) => (
                    <tr key={c.id} onClick={() => setSelected(c.id)} className={`cursor-pointer border-t border-line hover:bg-alt ${current?.id === c.id ? 'bg-accent-soft hover:bg-accent-soft' : ''}`}>
                      <td className="max-w-[260px] px-5 py-3"><p className="font-medium leading-snug">{c.post?.title}</p><p className="text-xs text-subtle">от {c.sender?.name}</p></td>
                      <td className="px-5 py-3">{c.reason_label}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-muted">{timeAgo(c.created_at)}</td>
                      <td className="px-5 py-3"><StatusBadge kind="complaint" status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={res.data.meta} onPage={setPage} />
          </div>
          {current && <Detail c={current} onSaved={res.reload} />}
        </div>
      )}
    </div>
  );
}
