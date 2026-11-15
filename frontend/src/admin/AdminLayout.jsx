import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Flag, Home, LayoutGrid, LogOut, Menu, Tag, Users, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Avatar, Logo } from '../components/ui.jsx';
import { shortName } from '../lib/format.js';
import { useToast } from '../components/Toast.jsx';

const LINKS = [
  ['/admin', 'Обзор', LayoutGrid, true],
  ['/admin/posts', 'Публикации', FileText],
  ['/admin/users', 'Пользователи', Users],
  ['/admin/taxonomy', 'Категории и теги', Tag],
  ['/admin/complaints', 'Жалобы', Flag],
];
const TITLES = { '/admin': 'Обзор', '/admin/posts': 'Управление публикациями', '/admin/users': 'Управление пользователями', '/admin/taxonomy': 'Категории и теги', '/admin/complaints': 'Обработка жалоб' };
const CRUMBS = { '/admin': 'Обзор', '/admin/posts': 'Публикации', '/admin/users': 'Пользователи', '/admin/taxonomy': 'Справочники', '/admin/complaints': 'Жалобы' };

function Sidebar({ newComplaints, onNavigate }) {
  const { logout } = useAuth();
  const nav = useNavigate();
  const notify = useToast();
  const item = (active) => `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? 'bg-sidebar-hover text-white before:absolute before:-left-3 before:h-5 before:w-0.5 before:bg-accent' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'}`;
  return (
    <div className="flex h-full flex-col bg-sidebar p-3 pl-6">
      <Link to="/admin" className="mb-8 mt-3 flex items-center gap-3" onClick={onNavigate}>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-serif text-lg font-semibold text-white">К</span>
        <span><span className="block font-serif text-lg text-white">Колонка</span><span className="block text-xs text-sidebar-text">Панель администратора</span></span>
      </Link>
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/70">Управление</p>
      <nav className="space-y-1 pr-3" onClick={onNavigate}>
        {LINKS.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => item(isActive)}>
            <Icon className="h-[18px] w-[18px]" /> {label}
            {to.endsWith('complaints') && newComplaints > 0 && <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-white">{newComplaints}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-1 pr-3">
        <Link to="/" className={item(false)}><Home className="h-[18px] w-[18px]" /> Открыть сайт</Link>
        <button className={`${item(false)} w-full`} onClick={async () => { await logout(); nav('/'); notify('Вы вышли из аккаунта.'); }}><LogOut className="h-[18px] w-[18px]" /> Выйти</button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [badge, setBadge] = useState(0);

  useEffect(() => {
    api('/admin/stats').then((r) => setBadge(r.week.new_complaints)).catch(() => {});
  }, [pathname]);

  return (
    <div className="min-h-screen lg:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 lg:block"><Sidebar newComplaints={badge} /></aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72">
            <button className="absolute right-3 top-4 z-10 text-white" onClick={() => setDrawer(false)} aria-label="Закрыть"><X className="h-5 w-5" /></button>
            <Sidebar newComplaints={badge} onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-line bg-surface px-4 md:px-8">
        <button className="icon-btn lg:hidden" onClick={() => setDrawer(true)} aria-label="Меню"><Menu className="h-4 w-4" /></button>
        <div>
          <p className="hidden text-xs text-subtle sm:block">Админ-панель / {CRUMBS[pathname] || ''}</p>
          <h1 className="font-serif text-xl font-semibold leading-tight">{TITLES[pathname] || 'Админ-панель'}</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Avatar name={user.name} />
          <div className="hidden text-sm leading-tight sm:block"><b>{shortName(user.name)}</b><div className="text-xs text-muted">Администратор</div></div>
        </div>
      </header>

      <main className="p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
