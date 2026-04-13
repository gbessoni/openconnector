interface HeroProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  dark?: boolean;
}

export function Hero({ title, subtitle, children, dark = true }: HeroProps) {
  return (
    <section
      className={`py-24 md:py-32 ${
        dark ? "bg-bg-dark text-text-light" : "bg-bg-light text-text-primary"
      }`}
    >
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <h1 className="font-serif text-4xl md:text-6xl leading-tight mb-6">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-80 mb-8">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
