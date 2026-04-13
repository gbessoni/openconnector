interface Stat {
  value: string;
  label: string;
}

interface StatsBarProps {
  stats: Stat[];
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="bg-bg-dark text-text-light py-16">
      <div className="mx-auto max-w-[1200px] px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="font-serif text-4xl md:text-5xl mb-2">
              {stat.value}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
