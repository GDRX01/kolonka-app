import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import { Avatar } from './ui.jsx';
import { coverStyle, formatDate } from '../lib/format.js';

/** The article card used on the home page and in search results. */
export default function PostCard({ post }) {
  return (
    <article className="card flex flex-col overflow-hidden transition-shadow hover:shadow-pop">
      <Link to={`/articles/${post.id}`} aria-hidden tabIndex={-1} className="block h-44 shrink-0" style={coverStyle(post.cover, post.cover_url)} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="eyebrow">{post.category?.name}</span>
          <span className="text-subtle">· {formatDate(post.published_at)}</span>
        </div>
        <h3 className="text-xl font-semibold leading-snug">
          <Link to={`/articles/${post.id}`} className="hover:text-accent">{post.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{post.excerpt}</p>
        <div className="mb-4 mt-3 flex flex-wrap gap-1.5">
          {post.tags?.slice(0, 3).map((t) => (
            <Link key={t.id} to={`/search?tags=${t.slug}`} className="chip hover:text-accent">#{t.name}</Link>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <Avatar name={post.author?.name} size="sm" />
            <span className="truncate">{post.author?.name}</span>
          </span>
          <span className="flex shrink-0 items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-muted">
              <Heart className={`h-4 w-4 ${post.liked ? 'fill-accent text-accent' : ''}`} /> {post.likes_count}
            </span>
            <Link to={`/articles/${post.id}`} className="flex items-center gap-1 font-medium text-accent hover:text-accent-hover">
              Читать <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </span>
        </div>
      </div>
    </article>
  );
}

export function PostGrid({ posts, className = 'md:grid-cols-2 xl:grid-cols-3' }) {
  return <div className={`grid grid-cols-1 gap-6 ${className}`}>{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>;
}
