// A tiny wrapper around fetch(): adds the Bearer token, parses JSON, throws ApiError.
const BASE = import.meta.env.VITE_API_URL || '/api';
const KEY = 'kolonka_token';

export const tokenStore = {
  get: () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY),
  // "Remember me" -> localStorage (survives closing the browser); otherwise sessionStorage
  set: (token, remember = true) => {
    tokenStore.clear();
    (remember ? localStorage : sessionStorage).setItem(KEY, token);
  },
  clear: () => {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  },
};

/** Uploaded files live on the API server; VITE_ASSET_URL is only needed if it is another domain. */
export const assetUrl = (path) => (path ? (import.meta.env.VITE_ASSET_URL || '') + path : null);

export class ApiError extends Error {
  constructor(status, message, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors; // { field: ['message', ...] } from Laravel validation
  }
  /** First message for a field, or undefined */
  first(field) {
    return this.errors?.[field]?.[0];
  }
}

export async function api(path, { method = 'GET', body, params } = {}) {
  let url = BASE + path;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const s = qs.toString();
    if (s) url += '?' + s;
  }

  const headers = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  // for FormData the browser sets Content-Type itself (with the multipart boundary)
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'Нет соединения с сервером. Проверьте, что Laravel запущен.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new ApiError(res.status, data?.message || 'Что-то пошло не так. Попробуйте ещё раз.', data?.errors);
  }
  return data;
}
