import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs `fn` whenever `deps` change and returns { data, loading, error, reload, setData }.
 * Late responses from outdated requests are ignored.
 */
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const counter = useRef(0);

  const run = useCallback(() => {
    const id = ++counter.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => id === counter.current && setState({ data, loading: false, error: null }))
      .catch((error) => id === counter.current && setState((s) => ({ ...s, loading: false, error })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: run, setData };
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
