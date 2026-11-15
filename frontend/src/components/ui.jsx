import { useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Loader2, X } from 'lucide-react';
import { COMPLAINT_STATUS, STATUS, initials } from '../lib/format.js';

export function Avatar({ name, size = 'md' }) {
  const sizes = { xs: 'h-6 w-6 text-[10px]', sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-14 w-14 text-sm', xl: 'h-20 w-20 text-xl' };
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-medium text-accent ${sizes[size]}`}>
      {initials(name)}
    </span>
  );
}

export function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-serif text-lg font-semibold text-white">К</span>
      <span className={`font-serif text-xl font-medium ${light ? 'text-white' : 'text-ink'}`}>Колонка</span>
    </span>
  );
}

export function StatusBadge({ status, kind = 'post' }) {
  const s = (kind === 'complaint' ? COMPLAINT_STATUS : STATUS)[status] || { label: status, cls: 'bg-alt text-muted' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function Spinner({ className = '' }) {
  return (
    <div className={`flex justify-center py-12 text-subtle ${className}`} role="status" aria-label="Загрузка">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function Alert({ type = 'error', children, className = '' }) {
  if (!children) return null;
  const map = {
    error: ['bg-danger-soft text-danger', CircleAlert],
    success: ['bg-success-soft text-success', CircleCheck],
    info: ['bg-accent-soft text-accent', CircleAlert],
  };
  const [cls, Icon] = map[type];
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm ${cls} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <p className="mb-4 text-sm text-muted">{error.message}</p>
      {onRetry && <button className="btn-outline" onClick={onRetry}>Повторить</button>}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-serif text-xl">{title}</p>
      {children && <p className="mt-2 text-sm text-muted">{children}</p>}
    </div>
  );
}

/** Label + input + validation message. `error` is a string or undefined. */
export function Field({ label, error, hint, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-subtle">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

/** Native <select> with the design's chevron. */
export function Select({ className = '', children, ...props }) {
  return (
    <div className="relative">
      <select {...props} className={`input appearance-none pr-9 ${className}`}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

/** Centered dialog on desktop, bottom sheet on phones. */
export function Modal({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 md:items-center md:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-surface p-5 shadow-pop md:max-w-md md:rounded-xl md:p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          <button className="text-muted hover:text-ink" onClick={onClose} aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** meta = Laravel paginator meta { current_page, last_page } */
export function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;
  const { current_page: cur, last_page: last } = meta;

  const pages = new Set([1, 2, 3, last, cur - 1, cur, cur + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const items = [];
  list.forEach((p, i) => {
    if (i && p - list[i - 1] > 1) items.push('gap-' + p);
    items.push(p);
  });

  const base = 'flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm';
  return (
    <nav className="flex items-center gap-1.5" aria-label="Страницы">
      <button className={`${base} border-line bg-surface text-muted hover:bg-alt`} disabled={cur === 1} onClick={() => onPage(cur - 1)} aria-label="Назад">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {items.map((p) =>
        typeof p === 'string' ? (
          <span key={p} className={`${base} border-line bg-surface text-muted`}>…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)} aria-current={p === cur ? 'page' : undefined}
            className={`${base} ${p === cur ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:bg-alt'}`}>
            {p}
          </button>
        ),
      )}
      <button className={`${base} border-line bg-surface text-muted hover:bg-alt`} disabled={cur === last} onClick={() => onPage(cur + 1)} aria-label="Вперёд">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
