import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlogPostClient from "./BlogPostClient";

// ── Fetch helper ──
async function getPost(slug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { firstName: true, lastName: true, avatar: true } },
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: true } },
      comments: {
        where: { parentId: null },
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
          replies: {
            include: {
              user: { select: { firstName: true, lastName: true, avatar: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" as const },
      },
    },
  });
  return post;
}

// ── Dynamic Metadata ──
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://integrityman.network";
  const title = post.seoTitle || post.title;
  const description = post.metaDescription || post.excerpt || "";
  const ogImage = post.ogImage || post.coverImage || `${siteUrl}/images/og-default.jpg`;
  const ogTitle = post.ogTitle || title;
  const ogDesc = post.ogDescription || description;
  const twitterImg = post.twitterImage || ogImage;
  const canonical = post.canonicalUrl || `${siteUrl}/blog/${post.slug}`;

  const robots: { index: boolean; follow: boolean } = {
    index: !post.noIndex,
    follow: !post.noFollow,
  };

  const authorName = post.author
    ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "TIMN Editorial"
    : "TIMN Editorial";

  return {
    title: `${title} | TIMN Blog`,
    description,
    alternates: { canonical },
    robots,
    authors: [{ name: authorName }],
    keywords: post.focusKeyword ? [post.focusKeyword] : undefined,
    openGraph: {
      type: "article",
      title: ogTitle,
      description: ogDesc,
      url: canonical,
      siteName: "The Integrity Man Network",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      section: post.category?.name || undefined,
      tags: post.tags.map((t) => t.tag.name),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDesc,
      images: twitterImg ? [twitterImg] : undefined,
    },
  };
}

// ── Page Component (Server) ──
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://integrityman.network";
  const authorName = post.author
    ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "TIMN Editorial"
    : "TIMN Editorial";

  // Track view via API from client
  // Fetch related posts
  let relatedPosts: Array<{
    id: string; title: string; slug: string; excerpt: string | null;
    coverImage: string | null; readingTime: number; publishedAt: Date | null;
    author: { firstName: string | null; lastName: string | null; avatar: string | null } | null;
    category: { name: string; slug: string } | null;
  }> = [];
  try {
    relatedPosts = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        id: { not: post.id },
        ...(post.categoryId ? { categoryId: post.categoryId } : {}),
      },
      select: {
        id: true, title: true, slug: true, excerpt: true,
        coverImage: true, readingTime: true, publishedAt: true,
        author: { select: { firstName: true, lastName: true, avatar: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });
  } catch { /* silent */ }

  // ── JSON-LD Structured Data ──
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.seoTitle || post.title,
        description: post.metaDescription || post.excerpt || "",
        image: post.ogImage || post.coverImage || undefined,
        author: { "@type": "Person", name: authorName },
        publisher: {
          "@type": "Organization",
          name: "The Integrity Man Network",
          url: siteUrl,
          logo: { "@type": "ImageObject", url: `${siteUrl}/images/logo.png` },
        },
        datePublished: post.publishedAt?.toISOString(),
        dateModified: post.updatedAt?.toISOString(),
        mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
        url: `${siteUrl}/blog/${post.slug}`,
        articleSection: post.category?.name || undefined,
        keywords: post.focusKeyword || undefined,
        wordCount: post.content.replace(/<[^>]*>/g, "").trim().split(/\s+/).length,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
        ],
      },
    ],
  };

  // Serialize post for client (convert all Date objects to strings)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializeComment = (c: any) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    user: c.user,
    replies: (c.replies || []).map(serializeComment),
  });

  const serializedPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    status: post.status,
    featured: post.featured,
    viewCount: post.viewCount,
    readingTime: post.readingTime,
    metaDescription: post.metaDescription,
    publishedAt: post.publishedAt?.toISOString() || null,
    createdAt: post.createdAt.toISOString(),
    author: post.author,
    category: post.category,
    tags: post.tags,
    comments: post.comments.map(serializeComment),
  };

  const serializedRelated = relatedPosts.map((r) => ({
    ...r,
    publishedAt: r.publishedAt?.toISOString() || null,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient post={serializedPost} relatedPosts={serializedRelated} />
    </>
  );
}
