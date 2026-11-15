import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Pencil, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { Alert, Avatar, Empty, ErrorBox, Field, Modal, Pagination, Spinner, StatusBadge } from '../components/ui.jsx';
import { coverStyle, formatDate, formatNumber, formatShortDate, plural } from '../lib/format.js';

function EditProfile({ open, onClose }) {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: user.name, email: user.email });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true); setErrors({});
    try {
      const r = await api('/me', { method: 'PUT', body: f });
      setUser(r.user);
      onClose();
    } catch (e) {
      const m = {};
      Object.keys(e.errors || {}).forEach((k) => (m[k] = e.first(k)));
      setErrors(Object.keys(m).length ? m : { name: e.message });
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Редактирование профиля">
      <div className="space-y-4">
        <Field label="Имя" error={errors.name}><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Электронная почта" error={errors.email}><input type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={save} disabled={busy}>Сохранить</button>
        </div>
      </div>
    </Modal>
  );
}

export default function Cabinet() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState('');

  const me = useFetch(() => api('/me'), [user.name, user.email]);
  const posts = useFetch(() => api('/my/posts', { params: { status, page } }), [status, page]);

  const remove = async (p) => {
    if (!window.confirm(`Удалить публикацию «${p.title}»? Это действие нельзя отменить.`)) return;
    try {
      await api(`/posts/${p.id}`, { method: 'DELETE' });
      setMsg('Публикация удалена.');
      posts.reload(); me.reload();
    } catch (e) { setMsg(e.message); }
  };

  const counts = posts.data?.counts;
  const tabs = [['', 'Все', counts?.all], ['published', 'Опубликованные', counts?.published], ['draft', 'Черновики', counts?.draft]];
  const stats = me.data?.stats;

  return (
    <div className="page-container py-10">
      <section className="card flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center">
        <div className="flex items-center gap-5">
          <Avatar name={user.name} size="xl" />
          <div className="min-w-0">
            <h1 className="text-3xl font-medium">{user.name}</h1>
            <p className="text-muted">{user.email}</p>
            <p className="mt-1 text-xs text-subtle">На сайте с {formatDate(user.created_at)} · Роль: {user.role === 'admin' ? 'администратор' : 'пользователь'}</p>
          </div>
        </div>
        <dl className="flex gap-8 text-center lg:ml-auto">
          {[[stats?.posts, ['публикация', 'публикации', 'публикаций']], [stats?.likes, ['лайк', 'лайка', 'лайков']], [stats?.comments, ['комментарий', 'комментария', 'комментариев']]].map(([n, forms]) => (
            <div key={forms[0]}><dt className="font-serif text-3xl">{formatNumber(n)}</dt><dd className="text-xs text-muted">{plural(n || 0, forms)}</dd></div>
          ))}
        </dl>
        <button className="btn-outline lg:ml-4" onClick={() => setEditing(true)}>Редактировать профиль</button>
      </section>
      {me.data?.interests.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
          Интересы: {me.data.interests.map((i) => <span key={i} className="chip">{i}</span>)}
        </p>
      )}

      <div className="mb-5 mt-10 flex items-center justify-between gap-4">
        <h2 className="text-3xl font-medium">Мои публикации</h2>
        <Link to="/cabinet/posts/new" className="btn-primary">+ Новая публикация</Link>
      </div>

      <div className="mb-4 flex gap-6 border-b border-line text-sm">
        {tabs.map(([key, label, n]) => (
          <button key={key} onClick={() => { setStatus(key); setPage(1); }}
            className={`-mb-px border-b-2 pb-3 font-medium ${status === key ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}>
            {label} <span className="ml-1 text-xs font-normal text-subtle">{n ?? ''}</span>
          </button>
        ))}
      </div>
      <Alert type="success" className="mb-4">{msg}</Alert>

      {posts.error ? <ErrorBox error={posts.error} onRetry={posts.reload} />
        : posts.loading && !posts.data ? <Spinner />
          : posts.data.data.length === 0 ? <div className="card"><Empty title="Здесь пока пусто">Напишите первую публикацию - она появится в этом списке.</Empty></div>
            : (
              <div className={`card overflow-hidden ${posts.loading ? 'opacity-60' : ''}`}>
                <div className="table-head hidden grid-cols-[1fr_150px_130px_90px_100px] gap-4 px-5 py-3 md:grid">
                  <span>Публикация</span><span>Статус</span><span>Дата</span><span>Лайки</span><span>Действия</span>
                </div>
                {posts.data.data.map((p) => (
                  <div key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-t border-line px-5 py-4 first:border-t-0 md:grid-cols-[1fr_150px_130px_90px_100px]">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-20 shrink-0 rounded-lg border border-line bg-alt" style={p.cover_url || p.status !== 'draft' ? coverStyle(p.cover, p.cover_url) : undefined} />
                      <div className="min-w-0">
                        <Link to={p.status === 'published' ? `/articles/${p.id}` : `/cabinet/posts/${p.id}/edit`} className={`font-serif font-medium leading-snug hover:text-accent ${p.status === 'draft' ? 'text-muted' : ''}`}>{p.title}</Link>
                        <p className="text-xs text-subtle">{p.category?.name}</p>
                      </div>
                    </div>
                    <div className="col-start-1 md:col-start-auto"><StatusBadge status={p.status} /></div>
                    <div className="hidden text-sm md:block">{p.status === 'published' ? formatShortDate(p.published_at) : <span className="text-subtle">создано {formatShortDate(p.created_at)}</span>}</div>
                    <div className="hidden text-sm text-muted md:block">{p.status === 'published' ? <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" />{p.likes_count}</span> : '-'}</div>
                    <div className="col-start-2 row-start-1 flex gap-2 md:col-start-auto md:row-start-auto">
                      <button className="icon-btn" aria-label="Редактировать" onClick={() => nav(`/cabinet/posts/${p.id}/edit`)}><Pencil className="h-4 w-4" /></button>
                      <button className="icon-btn-danger" aria-label="Удалить" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

      {posts.data && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
          <span>Показаны {posts.data.data.length} из {posts.data.meta.total} {plural(posts.data.meta.total, ['публикации', 'публикаций', 'публикаций'])}</span>
          <Pagination meta={posts.data.meta} onPage={setPage} />
        </div>
      )}

      {editing && <EditProfile open onClose={() => setEditing(false)} />}
    </div>
  );
}
