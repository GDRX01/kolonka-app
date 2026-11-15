import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { assetUrl } from '../lib/api.js';

const MAX_BYTES = 5 * 1024 * 1024; // keep in sync with 'max:5120' in PostCoverController
const TYPES = ['image/jpeg', 'image/png'];

/**
 * Cover photo chooser for the editor.
 *  currentUrl - photo already saved on the server (relative URL) or null
 *  file       - a NEW file the user picked and that is not uploaded yet
 *  removed    - the user pressed "Удалить" for the saved photo
 *  The parent owns the state and uploads the file after the article is saved.
 */
export default function CoverPicker({ currentUrl, file, removed, onPick, onRemove, fallbackStyle, error }) {
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState('');
  const [preview, setPreview] = useState(null);

  // a temporary browser-side URL for showing the chosen file before it is uploaded
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return setLocalError('Допустимы только изображения JPG и PNG.');
    if (f.size > MAX_BYTES) return setLocalError('Файл больше 5 МБ. Выберите изображение поменьше.');
    setLocalError('');
    onPick(f);
  };

  const shown = preview || (!removed && currentUrl ? assetUrl(currentUrl) : null);
  const message = localError || error;

  return (
    <div>
      <input ref={input} type="file" accept="image/png,image/jpeg" className="hidden"
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />

      {shown ? (
        <>
          <div className="h-36 rounded-lg border border-line" role="img" aria-label="Выбранная обложка"
            style={{ background: `url("${shown}") center / cover no-repeat, #f2eee7` }} />
          {file && <p className="mt-2 truncate text-xs text-muted">Новое фото: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} МБ) - загрузится при сохранении</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-outline btn-sm" onClick={() => input.current.click()}><Upload className="h-4 w-4" /> Заменить</button>
            <button type="button" className="btn-danger btn-sm" onClick={onRemove}><Trash2 className="h-4 w-4" /> Удалить</button>
          </div>
        </>
      ) : (
        <>
          <button type="button" onClick={() => input.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
            className={`flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center text-sm transition-colors ${drag ? 'border-accent bg-accent-soft' : 'border-strong bg-alt hover:bg-accent-soft/60'}`}>
            <ImagePlus className="h-6 w-6 text-muted" />
            <span>Перетащите изображение или выберите файл</span>
            <span className="text-xs text-subtle">JPG или PNG, до 5 МБ</span>
          </button>
          <div className="mt-3 flex items-center gap-3 text-xs text-subtle">
            <span className="h-8 w-12 shrink-0 rounded" style={fallbackStyle} />
            Если фото не выбрано, используется градиент по категории.
          </div>
        </>
      )}

      {message && <p className="field-error" role="alert">{message}</p>}
    </div>
  );
}
