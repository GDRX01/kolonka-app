import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useDebounced } from '../lib/hooks.js';

/**
 * Chips + text box.
 *  mode="free"   - the editor: any text becomes a tag (Enter or comma), `value` = array of names
 *  mode="filter" - the search page: only existing tags can be picked, `value` = array of {slug,name}
 */
export default function TagInput({ value, onChange, max = 5, mode = 'free', placeholder = '+ тег' }) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const debounced = useDebounced(text, 250);

  useEffect(() => {
    if (mode !== 'filter' || !debounced.trim()) return setSuggestions([]);
    let alive = true;
    api('/tags', { params: { q: debounced, limit: 6 } }).then((r) => alive && setSuggestions(r.data)).catch(() => { });
    return () => { alive = false; };
  }, [debounced, mode]);

  const keyOf = (t) => (mode === 'filter' ? t.slug : t);
  const labelOf = (t) => '#' + (mode === 'filter' ? t.name : t);

  const addFree = (raw) => {
    const name = raw.trim().replace(/^#+/, '').toLowerCase();
    if (!name || value.includes(name) || value.length >= max) return setText('');
    onChange([...value, name]);
    setText('');
  };
  const addTag = (t) => {
    if (!value.some((v) => v.slug === t.slug) && value.length < max) onChange([...value, { slug: t.slug, name: t.name }]);
    setText('');
    setSuggestions([]);
  };

  const onKeyDown = (e) => {
    if (mode === 'free' && (e.key === 'Enter' || e.key === ',')) { e.preventDefault(); addFree(text); }
    if (e.key === 'Enter' && mode === 'filter') { e.preventDefault(); if (suggestions[0]) addTag(suggestions[0]); }
    if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
  };

  return (
    <div className="relative">
      <div className="input flex min-h-[42px] flex-wrap items-center gap-1.5 py-1.5">
        {value.map((t) => (
          <span key={keyOf(t)} className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-1 text-xs text-accent">
            {labelOf(t)}
            <button type="button" onClick={() => onChange(value.filter((v) => keyOf(v) !== keyOf(t)))} aria-label={`Удалить ${labelOf(t)}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {value.length < max && (
          <input
            className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
            value={text}
            placeholder={value.length ? '+ тег' : placeholder}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => mode === 'free' && text && addFree(text)}
          />
        )}
      </div>
      {mode === 'filter' && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-line bg-surface p-1 shadow-pop">
          {suggestions.filter((s) => !value.some((v) => v.slug === s.slug)).map((s) => (
            <li key={s.id}>
              <button type="button" className="w-full rounded px-3 py-2 text-left text-sm hover:bg-alt" onMouseDown={(e) => { e.preventDefault(); addTag(s); }}>
                #{s.name} <span className="text-subtle">- {s.posts_count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
