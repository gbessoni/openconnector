import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllBlogPosts, getBlogPost } from "@/lib/mdx";
import { IntroRequestCTA } from "@/components/ui/IntroRequestCTA";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function ResourcePostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <article>
        <header className="bg-bg-dark text-text-light py-24">
          <div className="mx-auto max-w-[800px] px-6 text-center">
            {post.category && (
              <span className="text-xs font-medium uppercase tracking-wider text-accent mb-4 block">
                {post.category}
              </span>
            )}
            <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-4">
              {post.title}
            </h1>
            <time className="text-gray-400">{post.date}</time>
          </div>
        </header>

        <div className="bg-bg-light py-16">
          <div className="mx-auto max-w-[800px] px-6 prose prose-lg prose-gray">
            <MDXRemote source={post.content} />
          </div>
        </div>
      </article>

      <IntroRequestCTA />
    </>
  );
}
