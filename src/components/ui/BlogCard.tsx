import Link from "next/link";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category?: string;
}

export function BlogCard({ slug, title, excerpt, date, category }: BlogCardProps) {
  return (
    <Link
      href={`/resources/${slug}`}
      className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
    >
      {category && (
        <span className="text-xs font-medium uppercase tracking-wider text-accent">
          {category}
        </span>
      )}
      <h3 className="font-serif text-xl mt-2 mb-2 group-hover:text-accent transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed mb-3">{excerpt}</p>
      <time className="text-xs text-gray-400">{date}</time>
    </Link>
  );
}
