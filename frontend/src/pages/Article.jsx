import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Flag, Heart, MessageCircle } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { Alert, Avatar, ErrorBox, Spinner, StatusBadge } from '../components/ui.jsx';
import ReportModal from '../components/ReportModal.jsx';
import { coverStyle, formatDate, plural, timeAgo } from '../lib/format.js';
import { NotFound } from './Misc.jsx';

function CommentForm({ postId, parentId, onCreated, onCancel, placeholder = 'Напишите комментарий…', autoFocus }) {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
        <Link to="/login" state={{ from: `/articles/${postId}` }} className="font-medium text-accent">Войдите</Link>, чтобы оставить комментарий.
      </p>
    );
  }

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true); setError('');
    try {
      const r = await api(`/posts/${postId}/comments`, { method: 'POST', body: { body, parent_id: parentId || null } });
      setBody('');
      onCreated(r.data);
    } catch (e) {
      setError(e.first?.('body') || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Avatar name={user.name} size="sm" />
      <div className="flex-1">
        <textarea className="input h-24 resize-none" maxLength={2000} placeholder={placeholder} autoFocus={autoFocus} value={body} onChange={(e) => setBody(e.target.value)} />
        <Alert className="mt-2">{error}</Alert>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-subtle">Комментарии публикуются от вашего имени</span>
          <div className="flex gap-2">
            {onCancel && <button className="btn-ghost btn-sm" onClick={onCancel}>Отмена</button>}
            <button className="btn-primary btn-sm" onClick={submit} disabled={busy || !body.trim()}>Отправить</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Comment({ c, post, onReply, onDelete, isReply }) {
  const [replying, setReplying] = useState(false);
  const isAuthor = c.author?.id === post.author?.id;
  return (
    <div className={isReply ? 'ml-10 md:ml-12' : ''}>
      <div className="flex gap-3">
        <Avatar name={c.author?.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <b>{c.author?.name}</b>
            {isAuthor && <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">Автор</span>}
            <span className="text-xs text-subtle">{timeAgo(c.created_at)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-[15px]">{c.body}</p>
          <div className="mt-1.5 flex gap-4 text-xs text-muted">
            <button className="hover:text-ink" onClick={() => setReplying(!replying)}>Ответить</button>
            {c.can_delete && <button className="hover:text-danger" onClick={() => onDelete(c)}>Удалить</button>}
          </div>
          {replying && (
            <div className="mt-3">
              <CommentForm postId={post.id} parentId={c.id} autoFocus placeholder={`Ответ для ${c.author?.name}…`}
                onCancel={() => setReplying(false)} onCreated={(n) => { setReplying(false); onReply(n); }} />
            </div>
          )}
        </div>
      </div>
      {c.replies?.length > 0 && (
        <div className="mt-4 space-y-4">
          {c.replies.map((r) => <Comment key={r.id} c={r} post={post} isReply onReply={onReply} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

function Comments({ post }) {
  const [items, setItems] = useState(null);
  const [meta, setMeta] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const load = async (p) => {
    setBusy(true);
    try {
      const r = await api(`/posts/${post.id}/comments`, { params: { page: p } });
      setItems((old) => (p === 1 ? r.data : [...(old || []), ...r.data]));
      setMeta(r.meta); setTotal(r.total); setPage(p);
    } catch (e) { setError(e); } finally { setBusy(false); }
  };
  // load on first render and whenever the viewer changes (can_delete depends on who is signed in)
  useFetch(() => { load(1); return Promise.resolve(); }, [post.id, user?.id]);

  const reload = () => load(1);
  const remove = async (c) => {
    if (!window.confirm('Удалить комментарий?')) return;
    try { await api(`/comments/${c.id}`, { method: 'DELETE' }); reload(); } catch (e) { alert(e.message); }
  };

  return (
    <section id="comments" className="mt-12 scroll-mt-24">
      <h2 className="mb-6 text-2xl font-semibold">Комментарии · {total}</h2>
      <CommentForm postId={post.id} onCreated={reload} />
      <div className="mt-8 space-y-6">
        {error && <ErrorBox error={error} />}
        {items?.map((c) => <Comment key={c.id} c={c} post={post} onReply={reload} onDelete={remove} />)}
        {items && items.length === 0 && <p className="text-sm text-muted">Пока нет комментариев - будьте первым.</p>}
      </div>
      {busy && <Spinner />}
      {meta && page < meta.last_page && !busy && (
        <div className="mt-8 text-center"><button className="btn-outline" onClick={() => load(page + 1)}>Показать ещё</button></div>
      )}
    </section>
  );
}

export default function Article() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const { data, loading, error, setData } = useFetch(() => api(`/posts/${id}`), [id, user?.id]);
  const [reporting, setReporting] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  if (loading && !data) return <Spinner className="py-40" />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="page-container py-20"><ErrorBox error={error} /></div>;

  const post = data.data;

  const like = async () => {
    if (!user) return nav('/login', { state: { from: `/articles/${id}` } });
    setLikeBusy(true);
    try {
      const r = await api(`/posts/${id}/like`, { method: 'POST' });
      setData((d) => ({ ...d, data: { ...d.data, liked: r.liked, likes_count: r.likes_count } }));
    } catch (e) { alert(e.message); } finally { setLikeBusy(false); }
  };

  const report = () => (user ? setReporting(true) : nav('/login', { state: { from: `/articles/${id}` } }));

  return (
    <div className="page-container py-8">
      <nav className="mb-6 flex flex-wrap gap-1.5 text-xs text-subtle" aria-label="Хлебные крошки">
        <Link to="/" className="hover:text-ink">Главная</Link> /
        <Link to={`/search?category=${post.category?.slug}`} className="hover:text-ink">{post.category?.name}</Link> /
        <span className="text-muted">{post.title}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article>
          {post.status !== 'published' && <div className="mb-4"><StatusBadge status={post.status} /></div>}
          <p className="eyebrow">{post.category?.name}</p>
          <h1 className="mt-2 text-4xl font-medium leading-tight md:text-[44px]">{post.title}</h1>
          <p className="mt-4 text-lg text-muted">{post.excerpt}</p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={post.author?.name} />
              <div className="text-sm">
                <b>{post.author?.name}</b>
                <div className="text-xs text-muted">{formatDate(post.published_at || post.created_at)} · {post.read_minutes} мин чтения</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => <Link key={t.id} to={`/search?tags=${t.slug}`} className="chip hover:text-accent">#{t.name}</Link>)}
            </div>
          </div>

          <div role="img" aria-label={`Обложка: ${post.title}`} className="mt-6 h-64 rounded-xl md:h-80" style={coverStyle(post.cover, post.cover_url)} />

          <div className="article-body mt-8"><ReactMarkdown>{post.body}</ReactMarkdown></div>

          <div className="mt-10 flex flex-wrap items-center gap-2 border-y border-line py-3 text-sm">
            <button onClick={like} disabled={likeBusy} aria-pressed={post.liked}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-medium ${post.liked ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface hover:bg-alt'}`}>
              <Heart className={`h-4 w-4 ${post.liked ? 'fill-accent' : ''}`} /> {post.liked ? 'Нравится' : 'Нравится'} · {post.likes_count}
            </button>
            <a href="#comments" className="inline-flex items-center gap-2 px-3 py-2 text-muted hover:text-ink">
              <MessageCircle className="h-4 w-4" /> {post.comments_count} {plural(post.comments_count, ['комментарий', 'комментария', 'комментариев'])}
            </a>
            {post.status === 'published' && (
              <button onClick={report} className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-subtle hover:text-danger">
                <Flag className="h-4 w-4" /> Пожаловаться
              </button>
            )}
          </div>

          {post.status === 'published' && <Comments post={post} />}
        </article>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <Avatar name={post.author?.name} size="xl" />
            <h3 className="mt-4 text-xl font-medium">{post.author?.name}</h3>
            <p className="mt-2 text-sm text-subtle">
              {data.author_stats.posts} {plural(data.author_stats.posts, ['публикация', 'публикации', 'публикаций'])} · {data.author_stats.likes} {plural(data.author_stats.likes, ['лайк', 'лайка', 'лайков'])}
            </p>
            <Link to={`/search?author=${post.author?.id}`} className="btn-outline mt-5 w-full">Все публикации автора</Link>
          </div>

          {data.related.length > 0 && (
            <div>
              <h3 className="mb-4 text-xl font-medium">Похожие публикации</h3>
              <ol className="space-y-5">
                {data.related.map((p, i) => (
                  <li key={p.id} className="flex gap-4">
                    <span className="font-serif text-2xl text-strong">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <Link to={`/articles/${p.id}`} className="font-serif font-medium leading-snug hover:text-accent">{p.title}</Link>
                      <p className="mt-1 text-xs text-muted">{p.author?.name} · {p.likes_count} {plural(p.likes_count, ['лайк', 'лайка', 'лайков'])}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>

      <ReportModal post={post} open={reporting} onClose={() => setReporting(false)} />
    </div>
  );
}
