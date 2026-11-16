FROM php:8.3-cli

# Устанавливаем системные зависимости и расширения PHP для Laravel и MySQL
RUN apt-get update && apt-get install -y \
    git unzip curl libpng-dev libonig-dev libxml2-dev libzip-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Устанавливаем Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Рабочая папка внутри контейнера
WORKDIR /var/www/html

# Копируем файлы проекта из папки api/
COPY . .

# Ставим зависимости Laravel
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Права на папки кэша и логов
RUN chmod -R 775 storage bootstrap/cache

# Открываем порт и запускаем миграции + сервер
EXPOSE 10000
CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}