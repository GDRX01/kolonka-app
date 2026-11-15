import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="page-container py-32 text-center">
      <p className="eyebrow">Ошибка 404</p>
      <h1 className="mt-3 text-4xl font-medium">Страница не найдена</h1>
      <p className="mt-3 text-muted">Возможно, публикация была удалена или скрыта.</p>
      <Link to="/" className="btn-primary mt-8">На главную</Link>
    </div>
  );
}

export function About() {
  return (
    <div className="page-container max-w-3xl py-14">
      <h1 className="text-4xl font-medium">О проекте</h1>
      <p className="mt-5 text-lg text-muted">
        «Колонка» - информационная система ведения блога. Читатели находят статьи по категориям и тегам,
        а лента рекомендаций подстраивается под тех, кто ставит лайки.
      </p>
      <h2 id="rules" className="mt-12 scroll-mt-24 text-2xl font-medium">Правила публикаций</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-muted">
        <li>Пишите по делу и уважайте читателей.</li>
        <li>Не публикуйте спам, рекламу и чужие тексты без указания источника.</li>
        <li>Если материал нарушает правила, нажмите «Пожаловаться» - модератор рассмотрит жалобу.</li>
      </ul>
      <h2 id="contacts" className="mt-12 scroll-mt-24 text-2xl font-medium">Контакты</h2>
      <p className="mt-4 text-muted">По вопросам работы сайта: hello@kolonka.test</p>
    </div>
  );
}
