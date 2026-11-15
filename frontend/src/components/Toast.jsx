import { createContext, useCallback, useContext, useState } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

const ToastContext = createContext(() => {});

/** const notify = useToast();  notify('Текст');  notify('Ошибка', 'error'); */
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => setItems((list) => list.filter((i) => i.id !== id)), []);

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setItems((list) => [...list, { id, message, type }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {items.map((t) => {
          const ok = t.type === 'success';
          const Icon = ok ? CircleCheck : CircleAlert;
          return (
            <div key={t.id} role={ok ? 'status' : 'alert'}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-pop ${ok ? 'border-success/30 bg-success-soft text-success' : 'border-danger/30 bg-danger-soft text-danger'}`}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Закрыть уведомление"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
