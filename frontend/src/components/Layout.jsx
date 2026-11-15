import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { shortName } from '../lib/format.js';
import { Avatar, Logo } from './ui.jsx';
import { useToast } from './Toast.jsx';

const NAV = [
  ['/', 'Главная', true],
  ['/search', 'Статьи', false],
  ['/#categories', 'Категории', false],
  ['/about', 'О проекте', false],
];

function UserMenu() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();
  const notify = useToast();

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const item = 'block w-full px-4 py-2 text-left text-sm hover:bg-alt';
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 hover:bg-alt" aria-haspopup="menu" aria-expanded={open}>
        <Avatar name={user.name} />
        <span className="hidden text-sm font-medium lg:inline">{shortName(user.name)}</span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop" onClick={() => setOpen(false)}>
          <div className="border-b border-line px-4 py-2 text-xs text-muted">{user.email}</div>
          <Link to="/cabinet" className={item}>Личный кабинет</Link>
          <Link to="/cabinet/posts/new" className={item}>Написать статью</Link>
          {isAdmin && <Link to="/admin" className={item}>Админ-панель</Link>}
          <button className={`${item} text-danger`} onClick={async () => { await logout(); nav('/'); notify('Вы вышли из аккаунта.'); }}>Выйти</button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const nav = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => setMenu(false), [pathname]);

  const submit = (e) => {
    e.preventDefault();
    nav(`/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  const link = ({ isActive }) => `text-sm font-medium ${isActive ? 'text-ink' : 'text-muted hover:text-ink'}`;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="page-container flex h-16 items-center gap-6">
        <Link to="/" aria-label="Колонка - на главную"><Logo /></Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Основная навигация">
          {NAV.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} className={to.includes('#') ? () => 'text-sm font-medium text-muted hover:text-ink' : link}>{label}</NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <form onSubmit={submit} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск публикаций" aria-label="Поиск публикаций"
              className="h-10 w-44 rounded-lg bg-alt pl-9 pr-3 text-sm placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 lg:w-60" />
          </form>
          <Link to="/search" className="icon-btn md:hidden" aria-label="Поиск"><Search className="h-4 w-4" /></Link>

          {user ? (
            <>
              <Link to="/cabinet/posts/new" className="btn-primary hidden md:inline-flex">+ Написать статью</Link>
              <UserMenu />
            </>
          ) : (
            <>
              <Link to="/login" className="hidden px-2 text-sm font-medium sm:inline">Войти</Link>
              <Link to="/register" className="btn-primary hidden sm:inline-flex">Регистрация</Link>
            </>
          )}
          <button className="icon-btn lg:hidden" onClick={() => setMenu(true)} aria-label="Открыть меню"><Menu className="h-4 w-4" /></button>
        </div>
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-surface lg:hidden">
          <div className="page-container flex h-16 items-center justify-between">
            <Logo />
            <button className="icon-btn" onClick={() => setMenu(false)} aria-label="Закрыть меню"><X className="h-4 w-4" /></button>
          </div>
          <nav className="page-container mt-6 flex flex-col gap-5">
            {[...NAV.slice(0, 3), ['/search', 'Поиск'], NAV[3]].map(([to, label]) => (
              <Link key={label} to={to} className="font-serif text-2xl hover:text-accent">{label}</Link>
            ))}
            {!user && (
              <div className="mt-6 flex flex-col gap-3">
                <Link to="/login" className="btn-outline w-full">Войти</Link>
                <Link to="/register" className="btn-primary w-full">Регистрация</Link>
              </div>
            )}
            {user && <Link to="/cabinet/posts/new" className="btn-primary mt-4 w-full">+ Написать статью</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const col = 'text-sm text-muted hover:text-ink';
  const title = 'mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink';
  return (
    <footer className="mt-20 bg-alt">
      <div className="page-container py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted">Блог с персональными рекомендациями: читайте, пишите и находите статьи по своим интересам.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className={title}>Разделы</h4>
            <Link className={col} to="/">Главная</Link>
            <Link className={col} to="/search">Все статьи</Link>
            <Link className={col} to="/search">Поиск</Link>
            <Link className={col} to="/#categories">Категории</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className={title}>Аккаунт</h4>
            <Link className={col} to="/login">Вход</Link>
            <Link className={col} to="/register">Регистрация</Link>
            <Link className={col} to="/cabinet">Личный кабинет</Link>
            <Link className={col} to="/cabinet/posts/new">Написать статью</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className={title}>О проекте</h4>
            <Link className={col} to="/about">О блоге</Link>
            <Link className={col} to="/about#rules">Правила публикаций</Link>
            <Link className={col} to="/about#contacts">Контакты</Link>
          </div>
        </div>
        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-line pt-5 text-xs text-subtle sm:flex-row">
          <span>© 2026 Колонка. Информационная система ведения блога</span>
          <span>React · Laravel · MySQL</span>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  const { pathname, hash } = useLocation();

  // Scroll to #anchor after navigation, otherwise to the top
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) return void setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}

/** Centered layout for login / registration. */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]"><Outlet /></div>
    </div>
  );
}
