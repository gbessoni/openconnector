import Link from "next/link";
import { Hero } from "@/components/ui/Hero";
import { StatsBar } from "@/components/ui/StatsBar";
import { CompanyCard } from "@/components/ui/CompanyCard";
import { BlogCard } from "@/components/ui/BlogCard";
import { IntroRequestCTA } from "@/components/ui/IntroRequestCTA";
import { getAllCompanies, getCategoriesFromCompanies } from "@/lib/companies";
import { getAllBlogPosts } from "@/lib/mdx";

export default function HomePage() {
  const companies = getAllCompanies();
  const categories = getCategoriesFromCompanies();
  const posts = getAllBlogPosts().slice(0, 3);
  const featuredCompanies = companies.slice(0, 6);

  return (
    <>
      <Hero
        title="Skip the research. Get directly connected to the right team."
        subtitle="I work with a small group of high-performing companies across finance, growth, and operations. If there's a strong fit, I'll make a direct intro."
      >
        <Link
          href="/request-intro"
          className="inline-block bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-full font-medium transition-colors"
        >
          Get Connected
        </Link>
      </Hero>

      <StatsBar
        stats={[
          { value: "50+", label: "Vetted Companies" },
          { value: "13", label: "Categories" },
          { value: "100%", label: "Personally Reviewed" },
        ]}
      />

      {/* Categories */}
      <section className="bg-bg-light py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="font-serif text-3xl md:text-4xl mb-10 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow group"
              >
                <h3 className="font-serif text-lg group-hover:text-accent transition-colors">
                  {category.label}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {category.count}{" "}
                  {category.count === 1 ? "company" : "companies"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="bg-bg-accent py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="font-serif text-3xl md:text-4xl mb-10 text-center">
            Featured Companies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCompanies.map((company) => (
              <CompanyCard key={company.slug} company={company} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/companies"
              className="inline-block border border-text-primary hover:bg-bg-dark hover:text-text-light px-6 py-3 rounded-full text-sm font-medium transition-colors"
            >
              View All Companies
            </Link>
          </div>
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="bg-bg-light py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <h2 className="font-serif text-3xl md:text-4xl mb-10 text-center">
              Latest from the Blog
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  date={post.date}
                  category={post.category}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <IntroRequestCTA />
    </>
  );
}
