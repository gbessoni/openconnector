import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllBlogPosts, getBlogPost } from "@/lib/mdx";
import { IntroRequestCTA } from "@/components/ui/IntroRequestCTA";
import Link from "next/link";
import Image from "next/image";

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
        {/* Hero header */}
        <header className="bg-bg-dark text-text-light pt-20 pb-16">
          <div className="mx-auto max-w-[720px] px-6">
            <Link
              href="/resources"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8 w-fit"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              All Resources
            </Link>

            {post.category && (
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-accent mb-5">
                {post.category}
              </span>
            )}

            <h1 className="font-serif text-4xl md:text-[3.25rem] md:leading-[1.15] leading-tight mb-6">
              {post.title}
            </h1>

            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              {post.excerpt}
            </p>

            {/* Author line */}
            <div className="flex items-center gap-3 pt-6 border-t border-gray-700">
              <Image
                src="/images/greg-bessoni.jpg"
                alt="Greg Bessoni"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <p className="text-sm font-medium text-white">Greg Bessoni</p>
                <time className="text-xs text-gray-400">{post.date}</time>
              </div>
            </div>
          </div>
        </header>

        {/* Article body */}
        <div className="py-16 md:py-20" style={{ backgroundColor: '#ffffff' }}>
          <div className="mx-auto max-w-[720px] px-6">
            <div className="article-body">
              <MDXRemote source={post.content} />
            </div>
          </div>
        </div>
      </article>

      <IntroRequestCTA />
    </>
  );
}
