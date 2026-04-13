import type { Metadata } from "next";
import { Hero } from "@/components/ui/Hero";
import { BlogCard } from "@/components/ui/BlogCard";
import { getAllBlogPosts } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on choosing the right tools, partners, and strategies for your business.",
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <>
      <Hero
        title="Blog"
        subtitle="Insights on choosing the right tools, partners, and strategies for your business."
      />

      <section className="bg-bg-light py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          {posts.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">
              Coming soon. Check back for insights on choosing the right tools
              and partners.
            </p>
          ) : (
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
          )}
        </div>
      </section>
    </>
  );
}
