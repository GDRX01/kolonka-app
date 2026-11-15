import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { Avatar, ErrorBox, Spinner } from '../components/ui.jsx';
import { PostGrid } from '../components/PostCard.jsx';
import { coverStyle, formatDate, formatNumber, plural } from '../lib/format.js';

function Hero({ data }) {
  const { user } = useAuth();
  const f = data.featured;
  return (
    <section className="page-container grid gap-10 pb-10 pt-10 lg:grid-cols-2 lg:gap-14 lg:pt-12">
      <div>
        <p className="eyebrow">Блог о разработке и дизайне</p>
        <h1 className="mt-4 text-4xl font-medium leading-[1.15] md:text-5xl lg:text-[56px]">Читайте то, что вам действительно интересно</h1>
        <p className="mt-6 max-w-lg text-lg text-muted">
          Колонка подбирает публикации по категориям и тегам, которые вы читаете и отмечаете. Пишите свои статьи, обсуждайте и находите единомышленников.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/search" className="btn-primary px-5">Начать читать</Link>
          <Link to={user ? '/cabinet/posts/new' : '/register'} className="btn-outline px-5">Написать статью</Link>
        </div>
        <dl className="mt-8 flex gap-8">
          {[
            [data.stats.posts, ['публикация', 'публикации', 'публикаций']],
            [data.stats.authors, ['автор', 'автора', 'авторов']],
            [data.stats.categories, ['категория', 'категории', 'категорий']],
          ].map(([n, forms]) => (
            <div key={forms[0]}>
              <dt className="font-serif text-3xl">{formatNumber(n)}</dt>
              <dd className="text-sm text-muted">{plural(n, forms)}</dd>
            </div>
          ))}
        </dl>
      </div>

      {f && (
        <Link to={`/articles/${f.id}`} className="group block">
          <div className="h-64 rounded-xl sm:h-80" style={coverStyle(f.cover, f.cover_url)} />
          <div className="mt-4 flex flex-wrap items-center gap-x-2 text-xs">
            <span className="eyebrow">Статья дня</span>
            <span className="text-subtle">· {f.category?.name} · {f.read_minutes} мин чтения</span>
          </div>
          <h2 className="mt-2 text-2xl font-medium leading-snug group-hover:text-accent md:text-[28px]">{f.title}</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Avatar name={f.author?.name} size="xs" /> {f.author?.name} · {formatDate(f.published_at)}
          </div>
        </Link>
      )}
    </section>
  );
}

function SectionTitle({ title, sub, to, toLabel = 'Смотреть все' }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-medium md:text-[28px]">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {to && <Link to={to} className="shrink-0 text-sm font-medium text-accent hover:text-accent-hover">{toLabel} →</Link>}
    </div>
  );
}

function Latest() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    api('/posts', { params: { per_page: 4, page } })
      .then((r) => { if (alive) { setItems((old) => (page === 1 ? r.data : [...old, ...r.data])); setMeta(r.meta); } })
      .finally(() => alive && setBusy(false));
    return () => { alive = false; };
  }, [page]);

  return (
    <>
      <SectionTitle title="Последние публикации" to="/search" toLabel="Все статьи" />
      <PostGrid posts={items} className="md:grid-cols-2" />
      {busy && <Spinner />}
      {meta && page < meta.last_page && !busy && (
        <div className="mt-8 text-center">
          <button className="btn-outline px-6" onClick={() => setPage(page + 1)}>Показать ещё</button>
        </div>
      )}
    </>
  );
}

export default function Home() {
  const { user } = useAuth();
  const home = useFetch(() => api('/home'), [user?.id]);
  const rec = useFetch(() => api('/recommendations', { params: { limit: 3 } }), [user?.id]);

  if (home.loading && !home.data) return <Spinner className="py-40" />;
  if (home.error) return <div className="page-container py-20"><ErrorBox error={home.error} onRetry={home.reload} /></div>;
  const d = home.data;

  return (
    <>
      <Hero data={d} />

      <section id="categories" className="page-container scroll-mt-24 py-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Категории</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0">
          <Link to="/search" className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">Все</Link>
          {d.categories.map((c) => (
            <Link key={c.id} to={`/search?category=${c.slug}`} className="shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-strong hover:bg-alt">{c.name}</Link>
          ))}
        </div>
      </section>

      <section className="page-container pt-10">
        <SectionTitle
          title={rec.data?.personalized ? 'Рекомендовано для вас' : 'Популярные публикации'}
          sub={
            rec.data?.personalized
              ? `Подобрано по вашим интересам: ${rec.data.interests.join(', ')}`
              : user ? 'Поставьте лайк понравившимся статьям - и лента подстроится под вас' : 'Войдите, чтобы получать персональные рекомендации'
          }
          to="/search?sort=popular"
        />
        {rec.loading && !rec.data ? <Spinner /> : <PostGrid posts={rec.data?.data || []} />}
      </section>

      <div className="page-container mt-16 grid gap-10 lg:grid-cols-[1fr_340px]">
        <section><Latest /></section>

        <aside className="space-y-8">
          <div>
            <h2 className="mb-5 text-2xl font-medium">Популярное</h2>
            <ol className="space-y-5">
              {d.popular.map((p, i) => (
                <li key={p.id} className="flex gap-4">
                  <span className="font-serif text-3xl text-strong">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <Link to={`/articles/${p.id}`} className="font-serif text-[17px] font-medium leading-snug hover:text-accent">{p.title}</Link>
                    <p className="mt-1 text-xs text-muted">{p.author?.name} · {p.likes_count} {plural(p.likes_count, ['лайк', 'лайка', 'лайков'])}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-xl font-medium">Популярные теги</h3>
            <div className="flex flex-wrap gap-2">
              {d.tags.map((t) => <Link key={t.id} to={`/search?tags=${t.slug}`} className="chip py-1.5 hover:text-accent">#{t.name}</Link>)}
            </div>
          </div>

          <div className="rounded-xl bg-accent-soft p-6">
            <h3 className="text-xl font-medium">Поделитесь опытом</h3>
            <p className="mt-3 text-sm text-muted">Напишите статью - она появится в рекомендациях у читателей с похожими интересами.</p>
            <Link to={user ? '/cabinet/posts/new' : '/register'} className="btn-primary mt-5">Написать статью</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
