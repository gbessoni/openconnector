import Link from "next/link";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  external?: boolean;
}

export function Button({
  href,
  children,
  variant = "primary",
  external = false,
}: ButtonProps) {
  const baseClasses =
    "inline-block px-6 py-3 rounded-full text-sm font-medium transition-colors";
  const variantClasses =
    variant === "primary"
      ? "bg-accent hover:bg-accent-hover text-white"
      : "border border-current hover:bg-bg-dark hover:text-text-light";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${variantClasses}`}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={`${baseClasses} ${variantClasses}`}>
      {children}
    </Link>
  );
}
