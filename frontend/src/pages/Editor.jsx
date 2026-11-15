import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Bold, Code, Eye, Heading2, Heading3, Image as ImageIcon, Italic, Link as LinkIcon, List, Quote } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useFetch } from '../lib/hooks.js';
import { Alert, ErrorBox, Field, Select, Spinner, StatusBadge } from '../components/ui.jsx';
import TagInput from '../components/TagInput.jsx';
import CoverPicker from '../components/CoverPicker.jsx';
import { useToast } from '../components/Toast.jsx';
import { coverStyle, formatDate, plural } from '../lib/format.js';

const TITLE_MAX = 120;

/** Toolbar actions: wrap the selection (or insert a template) in Markdown syntax. */
const TOOLS = [
  ['Жирный', Bold, ['**', '**', 'жирный текст']],
  ['Курсив', Italic, ['*', '*', 'курсив']],
  ['Заголовок H2', Heading2, ['\n## ', '\n', 'Заголовок']],
  ['Заголовок H3', Heading3, ['\n### ', '\n', 'Подзаголовок']],
  ['Список', List, ['\n- ', '\n', 'пункт списка']],
  ['Цитата', Quote, ['\n> ', '\n', 'цитата']],
  ['Код', Code, ['`', '`', 'код']],
  ['Ссылка', LinkIcon, ['[', '](https://)', 'текст ссылки']],
  ['Изображение', ImageIcon, ['![', '](https://)', 'описание']],
];

export default function Editor() {
  const { id } = useParams();
  const editing = !!id;
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const notify = useToast();
  const ta = useRef(null);

  const cats = useFetch(() => api('/categories'), []);
  const popular = useFetch(() => api('/tags', { params: { limit: 4 } }), []);
  const [form, setForm] = useState({ title: '', excerpt: '', body: '', category_id: '', tags: [], status: 'draft' });
  const [meta, setMeta] = useState(null);
  const [preview, setPreview] = useState(false);
  // a failed photo upload right after creating the article arrives here through the router state
  const [errors, setErrors] = useState(() => (loc.state?.coverError ? { cover: loc.state.coverError } : {}));
  const [coverFile, setCoverFile] = useState(null);      // new photo, not uploaded yet
  const [coverRemoved, setCoverRemoved] = useState(false); // saved photo marked for removal
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const loaded = useFetch(async () => {
    if (!editing) return null;
    const r = await api(`/my/posts/${id}`);
    const p = r.data;
    setForm({ title: p.title, excerpt: p.excerpt_raw || '', body: p.body, category_id: String(p.category_id), tags: p.tags.map((t) => t.name), status: p.status });
    setMeta(p);
    return p;
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const wrap = ([before, after, placeholder]) => {
    const el = ta.current;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = form.body.slice(s, e) || placeholder;
    const next = form.body.slice(0, s) + before + selected + after + form.body.slice(e);
    setForm((f) => ({ ...f, body: next }));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + selected.length); });
  };

  const save = async (status) => {
    setBusy(true); setErrors({}); setNotice('');
    const body = { ...form, category_id: form.category_id ? Number(form.category_id) : null, status, excerpt: form.excerpt || null };

    // 1) the article itself (JSON)
    let saved;
    try {
      const r = editing ? await api(`/posts/${id}`, { method: 'PUT', body }) : await api('/posts', { method: 'POST', body });
      saved = r.data;
    } catch (err) {
      const m = {};
      Object.keys(err.errors || {}).forEach((k) => (m[k.split('.')[0]] = err.first(k)));
      setErrors(Object.keys(m).length ? m : { _: err.message });
      setBusy(false);
      return;
    }

    // 2) the cover photo (multipart, needs the article id - that is why it is a second request)
    let coverError = '';
    try {
      if (coverFile) {
        const fd = new FormData();
        fd.append('cover', coverFile);
        const c = await api(`/posts/${saved.id}/cover`, { method: 'POST', body: fd });
        saved = { ...saved, cover_url: c.cover_url };
      } else if (coverRemoved && saved.cover_url) {
        await api(`/posts/${saved.id}/cover`, { method: 'DELETE' });
        saved = { ...saved, cover_url: null };
      }
    } catch (err) {
      coverError = err.first?.('cover') || err.message;
    }
    setBusy(false);

    if (coverError) {
      // the article IS saved; only the photo failed - stay here so the user can try another file
      notify('Статья сохранена, но фото загрузить не удалось.', 'error');
      if (!editing) return nav(`/cabinet/posts/${saved.id}/edit`, { replace: true, state: { coverError } });
      setMeta(saved); setForm((f) => ({ ...f, status: saved.status })); setErrors({ cover: coverError });
      return;
    }

    setCoverFile(null); setCoverRemoved(false);
    if (status === 'published') {
      notify(editing && form.status === 'published' ? 'Изменения сохранены.' : 'Статья опубликована.');
      return nav(`/articles/${saved.id}`);
    }
    if (!editing) return nav(`/cabinet/posts/${saved.id}/edit`, { replace: true, state: { saved: true } });
    setMeta(saved); setForm((f) => ({ ...f, status: saved.status }));
    setNotice('Черновик сохранён. Его можно опубликовать в любой момент.');
  };

  if (editing && loaded.loading && !loaded.data) return <Spinner className="py-40" />;
  if (editing && loaded.error) return <div className="page-container py-20"><ErrorBox error={loaded.error} /></div>;

  const words = (form.body.match(/[\p{L}\p{N}]+/gu) || []).length;
  const isHidden = form.status === 'hidden';
  const cls = (k) => `input ${errors[k] ? 'input-error' : ''}`;

  return (
    <div className="page-container py-8">
      <nav className="mb-4 text-xs text-subtle">
        <Link to="/cabinet" className="hover:text-ink">Личный кабинет</Link> / <Link to="/cabinet" className="hover:text-ink">Мои публикации</Link> / <span className="text-muted">{editing ? 'Редактирование' : 'Создание публикации'}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium">{editing ? 'Редактирование публикации' : 'Создание публикации'}</h1>
          <p className="mt-1 text-sm text-muted">{form.status === 'published' ? 'Опубликовано' : form.status === 'hidden' ? 'Скрыто модератором' : 'Черновик'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/cabinet" className="px-3 text-sm font-medium">Отмена</Link>
          <button className="btn-outline" disabled={busy} onClick={() => save('draft')}>{form.status === 'published' ? 'Снять с публикации' : 'Сохранить черновик'}</button>
          <button className="btn-primary" disabled={busy || isHidden} onClick={() => save('published')}>{form.status === 'published' ? 'Сохранить' : 'Опубликовать'}</button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <Alert type="success">{notice}</Alert>
        <Alert>{errors._}</Alert>
        {isHidden && <Alert>Публикация скрыта модератором. Исправьте замечания - администратор сможет её вернуть.</Alert>}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="card space-y-6 p-6">
          <Field label="Заголовок" error={errors.title} hint={`${form.title.length} / ${TITLE_MAX} символов`}>
            <input className={`${cls('title')} font-serif text-xl font-medium`} maxLength={TITLE_MAX} value={form.title} onChange={set('title')} />
          </Field>
          <Field label="Краткое описание" error={errors.excerpt} hint="Показывается в карточках и в результатах поиска (до 300 символов)">
            <textarea className={`${cls('excerpt')} h-20 resize-none`} maxLength={300} value={form.excerpt} onChange={set('excerpt')} />
          </Field>

          <Field label="Основной текст" error={errors.body}>
            <div className={`overflow-hidden rounded-lg border ${errors.body ? 'border-danger' : 'border-strong'}`}>
              <div className="flex flex-wrap items-center gap-1 border-b border-line bg-alt p-2">
                {TOOLS.map(([label, Icon, args]) => (
                  <button key={label} type="button" title={label} aria-label={label} disabled={preview} onClick={() => wrap(args)} className="rounded p-1.5 text-muted hover:bg-surface hover:text-ink"><Icon className="h-4 w-4" /></button>
                ))}
                <button type="button" onClick={() => setPreview(!preview)} className={`ml-auto flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium ${preview ? 'bg-surface text-accent' : 'text-muted hover:bg-surface'}`}><Eye className="h-4 w-4" /> Просмотр</button>
              </div>
              {preview
                ? <div className="article-body min-h-[320px] bg-surface p-5"><ReactMarkdown>{form.body || '*Пока пусто*'}</ReactMarkdown></div>
                : <textarea ref={ta} className="block min-h-[320px] w-full resize-y bg-surface p-5 font-serif text-[17px] leading-8 outline-none" value={form.body} onChange={set('body')} />}
            </div>
            <div className="mt-1 flex justify-between text-xs text-subtle">
              <span>Поддерживается Markdown</span>
              <span>{form.body.length} символов - ~{Math.max(1, Math.ceil(words / 200))} мин чтения</span>
            </div>
          </Field>
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <h3 className="mb-3 text-lg font-medium">Публикация</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between"><dt className="text-muted">Статус</dt><dd><StatusBadge status={form.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted">Автор</dt><dd>{meta?.author?.name || user.name}</dd></div>
              {meta && <div className="flex justify-between"><dt className="text-muted">Создано</dt><dd>{formatDate(meta.created_at)}</dd></div>}
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-lg font-medium">Категория</h3>
            <Field label="Выберите категорию" error={errors.category_id}>
              <Select value={form.category_id} onChange={set('category_id')} className={errors.category_id ? 'input-error' : ''}>
                <option value="">- не выбрана -</option>
                {cats.data?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-lg font-medium">Теги</h3>
            <TagInput mode="free" max={5} value={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} placeholder="Добавьте тег…" />
            {errors.tags && <p className="field-error">{errors.tags}</p>}
            {popular.data?.data.length > 0 && (
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">Популярные:
                {popular.data.data.map((t) => (
                  <button key={t.id} type="button" className="chip hover:text-accent" onClick={() => !form.tags.includes(t.name) && form.tags.length < 5 && setForm((f) => ({ ...f, tags: [...f.tags, t.name] }))}>#{t.name}</button>
                ))}
              </p>
            )}
            <p className="mt-2 text-xs text-subtle">До 5 тегов - Enter или запятая - добавить</p>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-lg font-medium">Обложка</h3>
            <CoverPicker
              currentUrl={meta?.cover_url}
              file={coverFile}
              removed={coverRemoved}
              error={errors.cover}
              fallbackStyle={coverStyle(form.category_id ? Number(form.category_id) : 0)}
              onPick={(f) => { setCoverFile(f); setCoverRemoved(false); setErrors((e) => ({ ...e, cover: undefined })); }}
              onRemove={() => { setCoverFile(null); if (meta?.cover_url) setCoverRemoved(true); }}
            />
          </div>

          <div className="rounded-xl bg-accent-soft p-4 text-sm text-accent">
            Категория и теги определяют, каким читателям статья попадёт в рекомендации.
          </div>
        </aside>
      </div>
    </div>
  );
}
