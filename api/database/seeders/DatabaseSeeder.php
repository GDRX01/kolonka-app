<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Comment;
use App\Models\Complaint;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Demo data that mirrors the Figma design.
 * Every account has the password:  password
 *   admin:  dm@kolonka.test        user:  anna@kolonka.test
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Model::unguard();   // allow setting created_at for realistic dates
        mt_srand(42);       // the same "random" data on every run

        // ---------- users ----------
        $people = [
            ['Дмитрий Миронов', 'dm@kolonka.test', 'admin'],
            ['Анна Смирнова', 'anna@kolonka.test', 'user'],
            ['Илья Ковалёв', 'ilya@kolonka.test', 'user'],
            ['Мария Лебедева', 'maria@kolonka.test', 'user'],
            ['Олег Петров', 'oleg@kolonka.test', 'user'],
            ['Екатерина Орлова', 'katya@kolonka.test', 'user'],
            ['Пётр Сидоров', 'petr@kolonka.test', 'user'],
            ['Сергей Волков', 'sergey@kolonka.test', 'user'],
        ];
        $users = [];
        foreach ($people as $i => [$name, $email, $role]) {
            $users[] = User::create([
                'name' => $name,
                'email' => $email,
                'password' => 'password',
                'role' => $role,
                'is_blocked' => $email === 'petr@kolonka.test',
            ]);
            User::whereKey($users[$i]->id)->update(['created_at' => now()->subDays(60 - $i * 6)]);
        }
        [$admin, $anna, $ilya, $maria, $oleg, $katya, $petr, $sergey] = $users;

        // ---------- categories ----------
        $cat = [];
        foreach (['Разработка', 'Дизайн', 'Data Science', 'Карьера', 'Продукт', 'Инструменты', 'Безопасность'] as $name) {
            $cat[$name] = Category::create(['name' => $name, 'slug' => Str::slug($name)]);
        }

        // ---------- posts ----------
        // [title, category, author, tags, days ago, excerpt]
        $posts = [
            ['Как устроены персональные рекомендации в блогах', 'Разработка', $anna, ['алгоритмы', 'laravel', 'mysql'], 25, 'Разбираем, как категории и теги прочитанных статей превращаются в персональную ленту.'],
            ['React Query и Laravel API: загрузка данных без боли', 'Разработка', $maria, ['react', 'api'], 26, 'Кэширование, состояния загрузки и ошибок на реальном примере блога.'],
            ['Простая модель интересов пользователя на MySQL', 'Data Science', $oleg, ['mysql', 'рекомендации', 'laravel'], 27, 'Считаем веса категорий и тегов по лайкам и комментариям без машинного обучения.'],
            ['Первый год во фронтенде: что я сделала бы иначе', 'Карьера', $katya, ['карьера', 'frontend'], 28, 'Честно о выборе стека, пет-проектах и о том, как просить ревью.'],
            ['Редакционная типографика для веб-интерфейсов', 'Дизайн', $ilya, ['типографика', 'ui'], 29, 'Пара шрифтов, ритм и отступы - что делает длинный текст удобным для чтения.'],
            ['Модерация контента: как не утонуть в жалобах', 'Продукт', $admin, ['модерация', 'продукт'], 33, 'Статусы, приоритеты и шаблоны ответов для небольшой команды модераторов.'],
            ['Figma для разработчиков: читаем макеты быстрее', 'Инструменты', $anna, ['figma', 'workflow'], 35, 'Auto Layout, переменные и режим разработчика - что стоит знать верстальщику.'],
            ['Рекомендации для новых пользователей без истории', 'Разработка', $maria, ['laravel', 'ux', 'рекомендации'], 37, 'Что показывать гостю: популярное, выбор интересов при регистрации и смешанная лента.'],
            ['Индексы MySQL для поиска по тегам', 'Разработка', $oleg, ['mysql', 'laravel'], 42, 'Как ускорить выборку статей по нескольким тегам и не перегружать базу.'],
            ['Eloquent и связи многие-ко-многим на примере тегов', 'Разработка', $anna, ['laravel', 'php'], 45, 'Модели Article и Tag, промежуточная таблица и удобные запросы.'],
            ['Кэширование подборок: Redis или таблица в MySQL', 'Разработка', $katya, ['mysql', 'кэш'], 50, 'Сравниваем два подхода к хранению готовых рекомендаций для пользователя.'],
            ['Как заработать 100 000 за неделю без вложений', 'Продукт', $petr, ['продукт'], 31, 'Сомнительные советы, на которые жалуются читатели.'],
            ['Безопасность API: токены, роли и ограничения запросов', 'Безопасность', $sergey, ['api', 'php', 'тестирование'], 52, 'Минимальный чек-лист защиты REST API на Laravel Sanctum.'],
            ['Тестируем Laravel API: Feature-тесты за вечер', 'Инструменты', $ilya, ['тестирование', 'laravel', 'php'], 55, 'Как проверить авторизацию, права доступа и валидацию без браузера.'],
            ['Дизайн-токены: от Figma до Tailwind', 'Дизайн', $maria, ['figma', 'ui', 'frontend'], 58, 'Переносим цвета, шрифты и отступы из макета в конфигурацию Tailwind.'],
            ['Метрики для блога: что считать и зачем', 'Data Science', $katya, ['рекомендации', 'продукт'], 60, 'Просмотры, лайки и глубина чтения - простые показатели вместо сложной аналитики.'],
        ];

        $intro = [
            'Когда в блоге становится больше сотни статей, главная страница перестаёт помогать читателю. Новые публикации вытесняют старые, а интересные материалы теряются в ленте.',
            'Начнём с простой идеи: каждое действие читателя - лайк, комментарий или прочтение - добавляет вес категориям и тегам статьи, с которой он взаимодействовал.',
            'В этой заметке разберём задачу на небольшом, но реальном примере, чтобы каждый шаг можно было повторить у себя.',
        ];
        $middle = [
            "Достаточно трёх таблиц: `likes`, `comments` и `post_tag`. Запрос суммирует совпадения по категории и тегам и выбирает статьи с наибольшим результатом, исключая уже понравившиеся.",
            "Важно не усложнять раньше времени. Простой подсчёт совпадений работает быстро, легко объясняется и проверяется обычными тестами.",
        ];
        $quotes = [
            'Хорошая рекомендация - это не магия, а аккуратно посчитанная статистика того, что человеку уже понравилось.',
            'Сначала заставьте работать простое решение, а уже потом измеряйте, чего ему не хватает.',
        ];

        $tagCache = [];
        $created = [];
        foreach ($posts as $i => [$title, $catName, $author, $tags, $daysAgo, $excerpt]) {
            $body = $intro[$i % 3] . "\n\n" . $intro[($i + 1) % 3]
                . "\n\n## Откуда берутся интересы\n\n" . $middle[$i % 2]
                . "\n\n> " . $quotes[$i % 2]
                . "\n\nИтог: небольшой набор правил и аккуратные запросы к базе дают понятную персональную ленту без сложной инфраструктуры.";

            $post = Post::create([
                'user_id' => $author->id,
                'category_id' => $cat[$catName]->id,
                'title' => $title,
                'excerpt' => $excerpt,
                'body' => $body,
                'status' => Post::STATUS_PUBLISHED,
                'published_at' => now()->subDays($daysAgo)->setTime(10, 0),
            ]);
            Post::whereKey($post->id)->update(['created_at' => $post->published_at, 'updated_at' => $post->published_at]);

            $ids = [];
            foreach ($tags as $t) {
                $tagCache[$t] ??= Tag::create(['name' => $t, 'slug' => Str::slug($t)]);
                $ids[] = $tagCache[$t]->id;
            }
            $post->tags()->sync($ids);
            $created[] = $post;
        }

        // Two drafts for Anna (shown in her cabinet)
        foreach (
            [
                ['Веса тегов и затухание интересов', 'Разработка', ['рекомендации', 'mysql', 'алгоритмы']],
                ['Laravel Sanctum для SPA на React', 'Разработка', ['laravel', 'react', 'api']]
            ] as [$t, $c, $tg]
        ) {
            $d = Post::create([
                'user_id' => $anna->id,
                'category_id' => $cat[$c]->id,
                'title' => $t,
                'excerpt' => 'Черновик: как учитывать давность лайков и комментариев.',
                'body' => "Заготовка статьи.\n\n## План\n\n- вступление\n- примеры\n- выводы",
                'status' => Post::STATUS_DRAFT,
            ]);
            $ids = [];
            foreach ($tg as $x) {
                $tagCache[$x] ??= Tag::create(['name' => $x, 'slug' => Str::slug($x)]);
                $ids[] = $tagCache[$x]->id;
            }
            $d->tags()->sync($ids);
        }

        // ---------- likes (each user likes 5-9 other people's posts) ----------
        foreach ($users as $u) {
            $pool = collect($created)->where('user_id', '!=', $u->id)->shuffle()->take(mt_rand(5, 9));
            foreach ($pool as $p) {
                DB::table('likes')->insertOrIgnore([
                    'user_id' => $u->id,
                    'post_id' => $p->id,
                    'created_at' => now()->subDays(mt_rand(0, 20)),
                ]);
            }
        }

        // ---------- comments (a few with replies) ----------
        $texts = [
            'Отличный разбор! А как вы учитываете давность лайков - старые интересы со временем теряют вес?',
            'Спасибо, буду ждать продолжения.',
            'Добавлю, что для новых пользователей хорошо работает выбор интересов при регистрации.',
            'Было бы здорово увидеть пример кода целиком.',
            'Очень полезно, сохранил в закладки.',
        ];
        foreach (array_slice($created, 0, 8) as $p) {
            $first = Comment::create([
                'user_id' => collect($users)->where('id', '!=', $p->user_id)->random()->id,
                'post_id' => $p->id,
                'body' => $texts[mt_rand(0, 4)],
                'created_at' => now()->subHours(mt_rand(5, 60)),
                'updated_at' => now(),
            ]);
            Comment::create([
                'user_id' => $p->user_id,
                'post_id' => $p->id,
                'parent_id' => $first->id,
                'body' => 'Да, в запросе стоит окно в 30 дней, а свежие действия получают коэффициент повыше.',
                'created_at' => now()->subHours(mt_rand(1, 4)),
                'updated_at' => now(),
            ]);
            Comment::create([
                'user_id' => collect($users)->random()->id,
                'post_id' => $p->id,
                'body' => $texts[mt_rand(0, 4)],
                'created_at' => now()->subMinutes(mt_rand(10, 600)),
                'updated_at' => now(),
            ]);
        }

        // ---------- complaints ----------
        $spam = collect($created)->firstWhere('title', 'Как заработать 100 000 за неделю без вложений');
        $rows = [
            [$oleg, $spam, 'spam', null, 'new'],
            [$anna, $spam, 'spam', null, 'new'],
            [$maria, $created[3], 'abuse', 'В комментариях под статьёй автор грубо отвечает читателям, прошу проверить.', 'new'],
            [$katya, $created[8], 'misinformation', null, 'in_review'],
            [$sergey, $created[4], 'copyright', null, 'resolved'],
        ];
        foreach ($rows as $n => [$sender, $post, $reason, $details, $status]) {
            Complaint::create([
                'user_id' => $sender->id,
                'post_id' => $post->id,
                'reason' => $reason,
                'details' => $details,
                'status' => $status,
                'admin_id' => $status === 'new' ? null : $admin->id,
                'resolution' => $status === 'resolved' ? 'Нарушение не подтвердилось, автору отправлено предупреждение.' : null,
                'resolved_at' => $status === 'resolved' ? now()->subDay() : null,
                'created_at' => now()->subHours(($n + 1) * 7),
                'updated_at' => now(),
            ]);
        }

        Model::reguard();
    }
}
