# Колонка (Kolonka App)

Веб-приложение для публикаций с системой рекомендаций, комментариями, лайками, жалобами и панелью администратора.

## Структура проекта

* `backend/` — исходный код бэкенда (модели, контроллеры, миграции, тесты, маршруты для Laravel)
* `frontend/` — клиентская часть на React + Vite + Tailwind CSS
* `design-preview/` — дизайн-макеты и прототипы интерфейса

---

## Инструкция по развертыванию

### 1. Требования
* PHP >= 8.2 и Composer
* Node.js >= 18 и npm
* SQLite (или MySQL / PostgreSQL)

---

### 2. Установка и запуск Backend (`api/`)

1. Из корня проекта создайте новое приложение Laravel в папку `api`:
   ```bash
   composer create-project laravel/laravel api
   cd api
   ```

2. Установите Laravel Sanctum для аутентификации по API:
   ```bash
   composer require laravel/sanctum
   php artisan install:api
   ```

3. Скопируйте все файлы и папки из директории `../backend/` внутрь `api/` с заменой существующих файлов:
   * `app/`
   * `bootstrap/`
   * `database/`
   * `lang/`
   * `routes/`
   * `tests/`

4. Настройте переменные окружения:
   * Скопируйте `.env.example` в `.env`:
     ```bash
     cp .env.example .env
     ```
   * Добавьте параметры из файла `../backend/.env.additions` в конец вашего `.env`.
   * Сгенерируйте ключ приложения и создайте файл базы данных SQLite:
     ```bash
     php artisan key:generate
     touch database/database.sqlite
     ```

5. Запустите миграции, наполните базу начальными данными и создайте символическую ссылку для обложек постов:
   ```bash
   php artisan migrate --seed
   php artisan storage:link
   ```

6. Запустите сервер разработки API:
   ```bash
   php artisan serve
   ```
   Бэкенд будет доступен по адресу: `http://127.0.0.1:8000`

---

### 3. Установка и запуск Frontend (`frontend/`)

1. Откройте новый терминал, перейдите в папку `frontend` и установите зависимости:
   ```bash
   cd frontend
   npm install
   ```

2. Создайте файл `.env` на основе примера (при необходимости укажите адрес API):
   ```bash
   cp .env.example .env
   ```

3. Запустите фронтенд:
   ```bash
   npm run dev
   ```
   Приложение откроется в браузере (обычно по адресу `http://localhost:5173`).

---

## Запуск тестов (Backend)

В папке `api/` выполните:
```bash
php artisan test
```
