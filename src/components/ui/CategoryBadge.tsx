import Link from "next/link";

interface CategoryBadgeProps {
  category: string;
  categoryLabel: string;
  linked?: boolean;
}

export function CategoryBadge({
  category,
  categoryLabel,
  linked = true,
}: CategoryBadgeProps) {
  const classes =
    "inline-block text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full bg-bg-accent text-text-primary";

  if (linked) {
    return (
      <Link href={`/categories/${category}`} className={`${classes} hover:bg-accent hover:text-white transition-colors`}>
        {categoryLabel}
      </Link>
    );
  }

  return <span className={classes}>{categoryLabel}</span>;
}
