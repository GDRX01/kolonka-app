import { Link } from 'react-router-dom';
import { FileText, Flag, MessageSquare, Users } from 'lucide-react';
import { api } from '../lib/api.js';
import { useFetch } from '../lib/hooks.js';
import { Avatar, ErrorBox, Spinner, StatusBadge } from '../components/ui.jsx';
import { formatNumber, formatShortDate, timeAgo } from '../lib/format.js';

function Stat({ icon: Icon, label, value, note, danger }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-3 text-sm text-muted">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent"><Icon className="h-4 w-4" /></span>{label}
      </div>
      <div className="text-3xl font-semibold">{formatNumber(value)}</div>
      <div className={`mt-2 text-xs ${danger ? 'text-danger' : 'text-success'}`}>{note}</div>
    </div>
  );
}

function Panel({ title, to, children }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-lg font-medium">{title}</h2>
        <Link to={to} className="text-sm font-medium text-accent">Все →</Link>
      </div>
      {children}
    </section>
  );
}

export default function Overview() {
  const { data: d, loading, error, reload } = useFetch(() => api('/admin/stats'), []);
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (loading || !d) return <Spinner />;

  const max = Math.max(1, ...d.activity.map((a) => Math.max(a.posts, a.comments / 10)));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Пользователи" value={d.totals.users} note={`+${d.week.users} за неделю`} />
        <Stat icon={FileText} label="Публикации" value={d.totals.posts} note={`+${d.week.posts} за неделю`} />
        <Stat icon={MessageSquare} label="Комментарии" value={d.totals.comments} note={`+${d.week.comments} за неделю`} />
        <Stat icon={Flag} label="Жалобы" value={d.totals.complaints} note={`${d.week.new_complaints} новых`} danger />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="card p-5">
          <h2 className="text-lg font-medium">Активность за 14 дней</h2>
          <div className="mb-3 mt-3 flex gap-5 text-xs text-muted">
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-accent" /> Публикации</span>
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-strong" /> Комментарии (×10)</span>
          </div>
          <div className="flex h-56 items-end gap-1.5 border-b border-line sm:gap-3" role="img" aria-label="График активности за 14 дней">
            {d.activity.map((a) => (
              <div key={a.date} className="flex h-full flex-1 items-end justify-center gap-0.5" title={`${formatShortDate(a.date)}: публикаций ${a.posts}, комментариев ${a.comments}`}>
                <div className="w-1/2 max-w-3 rounded-t bg-accent" style={{ height: `${(a.posts / max) * 100}%` }} />
                <div className="w-1/2 max-w-3 rounded-t bg-strong" style={{ height: `${(a.comments / 10 / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-subtle"><span>{formatShortDate(d.activity[0].date)}</span><span>{formatShortDate(d.activity[13].date)}</span></div>
        </section>

        <Panel title="Последние жалобы" to="/admin/complaints">
          {d.recent_complaints.length === 0 && <p className="px-5 pb-5 text-sm text-muted">Жалоб пока нет.</p>}
          {d.recent_complaints.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 border-t border-line px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.post?.title}</p>
                <p className="text-xs text-subtle">{c.reason_label} · {timeAgo(c.created_at)}</p>
              </div>
              <StatusBadge kind="complaint" status={c.status} />
            </div>
          ))}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Новые пользователи" to="/admin/users">
          {d.new_users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 border-t border-line px-5 py-3">
              <Avatar name={u.name} size="sm" />
              <span className="flex-1 text-sm font-medium">{u.name}</span>
              <span className="hidden text-sm text-muted sm:inline">{u.role === 'admin' ? 'Администратор' : 'Пользователь'}</span>
              <span className="text-sm text-muted">{formatShortDate(u.created_at)}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Последние публикации" to="/admin/posts">
          {d.recent_posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="text-xs text-subtle">{p.author?.name} · {formatShortDate(p.created_at)}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
