interface IntroRequestCTAProps {
  companySlug?: string;
}

export function IntroRequestCTA({ companySlug }: IntroRequestCTAProps) {
  const baseUrl = "https://teams-intro.lovable.app/";
  const url = companySlug ? `${baseUrl}?company=${companySlug}` : baseUrl;

  return (
    <section className="bg-bg-dark text-text-light py-20">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <h2 className="font-serif text-3xl md:text-4xl mb-4">
          Ready to get connected?
        </h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          I review every request personally. Only strong fits get connected.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-full font-medium transition-colors"
        >
          Request an Intro
        </a>
      </div>
    </section>
  );
}
