import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Alert, Field, Logo } from '../components/ui.jsx';
import { dashboardFor } from '../components/Guards.jsx';
import { useToast } from '../components/Toast.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Shell({ title, subtitle, children, footer }) {
  return (
    <>
      <Link to="/" className="mb-4 inline-block"><Logo /></Link>
      <h1 className="text-4xl font-medium">{title}</h1>
      <p className="mb-6 mt-2 text-muted">{subtitle}</p>
      {children}
      <p className="mt-6 text-center text-sm text-muted">{footer}</p>
    </>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const notify = useToast();
  const from = useLocation().state?.from;
  const [f, setF] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /** Client-side checks (the server validates again - never trust the browser alone). */
  const validate = () => {
    const e = {};
    if (!f.email.trim()) e.email = 'Введите адрес электронной почты.';
    else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Введите корректный адрес электронной почты.';
    if (!f.password) e.password = 'Введите пароль.';
    else if (f.password.length < 8) e.password = 'Пароль должен содержать не менее 8 символов.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setError('');
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const user = await login(f.email.trim(), f.password, remember);
      notify(`Добро пожаловать, ${user.name}!`);
      nav(dashboardFor(user, from), { replace: true });
    } catch (err) {
      setError(err.first?.('email') || err.message); // e.g. "Неверный email или пароль" / "учётная запись заблокирована"
    } finally {
      setBusy(false);
    }
  };

  const cls = (k) => `input ${errors[k] ? 'input-error' : ''}`;
  return (
    <Shell title="Вход в аккаунт" subtitle="Рады видеть вас снова" footer={<>Нет аккаунта? <Link to="/register" state={{ from }} className="font-medium text-accent">Зарегистрироваться</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Alert>{error}</Alert>
        <Field label="Электронная почта" error={errors.email}>
          <input type="email" className={cls('email')} autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <Field label="Пароль" error={errors.password}>
          <input type="password" className={cls('password')} autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[#b4532a]" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Запомнить меня
        </label>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const notify = useToast();
  const from = useLocation().state?.from;
  const [f, setF] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Введите имя (не менее 2 символов).';
    if (!f.email.trim()) e.email = 'Введите адрес электронной почты.';
    else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Введите корректный адрес электронной почты.';
    if (f.password.length < 8) e.password = 'Пароль должен содержать не менее 8 символов.';
    if (f.password !== f.password_confirmation) e.password_confirmation = 'Пароли не совпадают.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setError('');
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const user = await register({ ...f, name: f.name.trim(), email: f.email.trim() });
      notify('Аккаунт создан. Добро пожаловать в Колонку!');
      nav(dashboardFor(user, from), { replace: true });
    } catch (err) {
      const server = {};
      Object.keys(err.errors || {}).forEach((k) => (server[k] = err.first(k)));
      setErrors(server);
      if (!Object.keys(server).length) setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const cls = (k) => `input ${errors[k] ? 'input-error' : ''}`;
  return (
    <Shell title="Создание аккаунта" subtitle="Займёт меньше минуты" footer={<>Уже есть аккаунт? <Link to="/login" state={{ from }} className="font-medium text-accent">Войти</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Alert>{error}</Alert>
        <Field label="Имя" error={errors.name}><input className={cls('name')} autoComplete="name" value={f.name} onChange={set('name')} /></Field>
        <Field label="Электронная почта" error={errors.email}><input type="email" className={cls('email')} autoComplete="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Пароль" error={errors.password} hint="Не менее 8 символов"><input type="password" className={cls('password')} autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
        <Field label="Подтверждение пароля" error={errors.password_confirmation}><input type="password" className={cls('password_confirmation')} autoComplete="new-password" value={f.password_confirmation} onChange={set('password_confirmation')} /></Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Создаём…' : 'Зарегистрироваться'}</button>
        <p className="text-center text-xs text-subtle">Нажимая кнопку, вы соглашаетесь с правилами публикаций и обработкой персональных данных.</p>
      </form>
    </Shell>
  );
}
