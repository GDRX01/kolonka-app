import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useFetch } from '../lib/hooks.js';
import { Empty, ErrorBox, Field, Modal, Pagination, Select, Spinner } from '../components/ui.jsx';
import { PostGrid } from '../components/PostCard.jsx';
import TagInput from '../components/TagInput.jsx';
import { plural } from '../lib/format.js';

/** All filters live in the URL (?q=&category=&tags=&sort=&period=&page=), so results can be shared. */
export default function Search() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '';
  const category = sp.get('category') || '';
  const sort = sp.get('sort') || 'new';
  const period = sp.get('period') || 'all';
  const author = sp.get('author') || '';
  const tagSlugs = (sp.get('tags') || '').split(',').filter(Boolean);
  const page = Number(sp.get('page') || 1);

  const [text, setText] = useState(q);
  const [sheet, setSheet] = useState(false);
  useEffect(() => setText(q), [q]);

  const set = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries({ page: undefined, ...patch }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (next.get('sort') === 'new') next.delete('sort');
    if (next.get('period') === 'all') next.delete('period');
    setSp(next);
  };

  const cats = useFetch(() => api('/categories'), []);
  const known = useFetch(() => (tagSlugs.length ? api('/tags', { params: { limit: 100 } }) : Promise.resolve({ data: [] })), [sp.get('tags')]);
  const tagValue = tagSlugs.map((s) => ({ slug: s, name: known.data?.data.find((t) => t.slug === s)?.name || s }));

  const res = useFetch(
    () => api('/posts', { params: { q, category, sort, period, author, tags: tagSlugs.join(','), page, per_page: 9 } }),
    [q, category, sort, period, author, sp.get('tags'), page],
  );

  const hasFilters = q || category || tagSlugs.length || sort !== 'new' || period !== 'all' || author;

  const Filters = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Категория">
        <Select value={category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">Все категории</option>
          {cats.data?.data.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="Сортировка">
        <Select value={sort} onChange={(e) => set({ sort: e.target.value })}>
          <option value="new">Сначала новые</option>
          <option value="popular">Сначала популярные</option>
        </Select>
      </Field>
      <Field label="Период">
        <Select value={period} onChange={(e) => set({ period: e.target.value })}>
          <option value="all">За всё время</option>
          <option value="week">За неделю</option>
          <option value="month">За месяц</option>
          <option value="year">За год</option>
        </Select>
      </Field>
      <Field label="Теги">
        <TagInput mode="filter" max={5} value={tagValue} onChange={(v) => set({ tags: v.map((t) => t.slug).join(',') })} />
      </Field>
    </div>
  );

  return (
    <div className="page-container py-10">
      <h1 className="text-4xl font-medium md:text-[40px]">{author ? 'Публикации автора' : 'Поиск публикаций'}</h1>

      <form className="mt-6 flex gap-3" onSubmit={(e) => { e.preventDefault(); set({ q: text.trim() }); }}>
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input className="input h-12 pl-12 pr-10 text-base" value={text} onChange={(e) => setText(e.target.value)} placeholder="Поиск по заголовку и тексту" aria-label="Поиск" />
          {text && <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" onClick={() => { setText(''); set({ q: '' }); }} aria-label="Очистить"><X className="h-4 w-4" /></button>}
        </div>
        <button className="btn-primary h-12 px-6">Найти</button>
        <button type="button" className="btn-outline h-12 lg:hidden" onClick={() => setSheet(true)} aria-label="Фильтры"><SlidersHorizontal className="h-4 w-4" /></button>
      </form>

      <div className="mt-5 hidden lg:block">{Filters}</div>
      <Modal open={sheet} onClose={() => setSheet(false)} title="Фильтры">
        <div className="space-y-4">
          <div className="grid gap-4">{Filters}</div>
          <button className="btn-primary w-full" onClick={() => setSheet(false)}>
            Показать {res.data?.meta?.total ?? ''} {res.data ? plural(res.data.meta.total, ['публикацию', 'публикации', 'публикаций']) : ''}
          </button>
        </div>
      </Modal>

      <div className="mb-6 mt-6 flex items-center justify-between text-sm">
        <p>
          {res.data && (<>
            <b>Найдено {res.data.meta.total} {plural(res.data.meta.total, ['публикация', 'публикации', 'публикаций'])}</b>
            {q && <span className="text-muted"> по запросу «{q}»</span>}
          </>)}
        </p>
        {hasFilters && <button className="font-medium text-accent hover:text-accent-hover" onClick={() => { setText(''); setSp(new URLSearchParams()); }}>Сбросить фильтры</button>}
      </div>

      {res.error ? <ErrorBox error={res.error} onRetry={res.reload} />
        : res.loading && !res.data ? <Spinner />
        : res.data.data.length === 0 ? <Empty title="Ничего не найдено">Попробуйте изменить запрос или сбросить фильтры.</Empty>
        : (
          <div className={res.loading ? 'opacity-60 transition-opacity' : ''}>
            <PostGrid posts={res.data.data} />
            <div className="mt-10 flex justify-center"><Pagination meta={res.data.meta} onPage={(p) => { set({ page: p }); window.scrollTo(0, 0); }} /></div>
          </div>
        )}
    </div>
  );
}
