import { assetUrl } from './api.js';

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });

export const formatDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '');
export const formatShortDate = (iso) => (iso ? shortFmt.format(new Date(iso)) : '');
export const formatNumber = (n) => new Intl.NumberFormat('ru-RU').format(n ?? 0);

/** "2 часа назад", "вчера" ... */
export function timeAgo(iso) {
  const sec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const steps = [
    ['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(sec) >= size) return rtf.format(Math.round(sec / size), unit);
  }
  return 'только что';
}

/** plural(5, ['публикация','публикации','публикаций']) -> 'публикаций' */
export function plural(n, forms) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');

/** "Анна Смирнова" -> "Анна С." */
export function shortName(name = '') {
  const [first, last] = name.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : first || '';
}

// The design has 7 gradient covers; the API sends `cover` = category_id % 7.
export const COVERS = [
  ['#dbe5e0', '#5c8a7b'], // sage
  ['#e6e1f1', '#7a6fa8'], // lavender
  ['#efd5c0', '#b87050'], // terracotta
  ['#f3e0b9', '#bf8a2c'], // gold
  ['#dde5ee', '#4b6a8c'], // blue
  ['#ecd5d3', '#9c5446'], // rose
  ['#e0e5d0', '#6b7d45'], // olive
];
/**
 * Style of a cover block. With an uploaded photo (`url`) the photo is drawn on top and the category
 * gradient stays underneath - it shows if the image is missing or still loading.
 */
export const coverStyle = (n = 0, url = null) => {
  const [a, b] = COVERS[((n % 7) + 7) % 7];
  const gradient = `linear-gradient(135deg, ${a}, ${b})`;
  return url
    ? { background: `url("${assetUrl(url)}") center / cover no-repeat, ${gradient}` }
    : { background: gradient };
};

export const STATUS = {
  published: { label: 'Опубликовано', cls: 'bg-success-soft text-success' },
  draft: { label: 'Черновик', cls: 'bg-alt text-muted' },
  hidden: { label: 'Скрыто', cls: 'bg-danger-soft text-danger' },
};
export const COMPLAINT_STATUS = {
  new: { label: 'Новая', cls: 'bg-accent-soft text-accent' },
  in_review: { label: 'На рассмотрении', cls: 'bg-warning-soft text-warning' },
  resolved: { label: 'Решена', cls: 'bg-success-soft text-success' },
  rejected: { label: 'Отклонена', cls: 'bg-danger-soft text-danger' },
};
export const REASONS = [
  ['spam', 'Спам или реклама'],
  ['abuse', 'Оскорбления'],
  ['misinformation', 'Недостоверная информация'],
  ['copyright', 'Нарушение авторских прав'],
  ['other', 'Другое'],
];
