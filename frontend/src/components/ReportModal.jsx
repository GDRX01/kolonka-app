import { useState } from 'react';
import { api } from '../lib/api.js';
import { REASONS } from '../lib/format.js';
import { Alert, Modal } from './ui.jsx';

export default function ReportModal({ post, open, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const close = () => { setReason(''); setDetails(''); setError(''); setDone(''); onClose(); };

  const submit = async () => {
    if (!reason) return setError('Выберите причину жалобы.');
    setBusy(true); setError('');
    try {
      const r = await api(`/posts/${post.id}/complaints`, { method: 'POST', body: { reason, details: details || null } });
      setDone(r.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Пожаловаться на публикацию" subtitle={`«${post.title}»`}>
      {done ? (
        <div className="space-y-4">
          <Alert type="success">{done}</Alert>
          <button className="btn-primary w-full" onClick={close}>Закрыть</button>
        </div>
      ) : (
        <div className="space-y-4">
          <fieldset>
            <legend className="label">Причина</legend>
            <div className="space-y-2">
              {REASONS.map(([key, label]) => (
                <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${reason === key ? 'border-accent bg-accent-soft' : 'border-line hover:bg-alt'}`}>
                  <input type="radio" name="reason" value={key} checked={reason === key} onChange={() => setReason(key)} className="accent-[#b4532a]" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label">Комментарий (необязательно)</label>
            <textarea className="input h-24 resize-none" maxLength={1000} placeholder="Опишите, что не так с публикацией" value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <Alert>{error}</Alert>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={close}>Отмена</button>
            <button className="btn-primary" onClick={submit} disabled={busy}>Отправить жалобу</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
