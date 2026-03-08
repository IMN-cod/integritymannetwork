"use client";

import { use, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  BookOpen,
  Tag,
  Eye,
  MessageSquare,
  ChevronRight,
  Loader2,
  Link2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Author {
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
}

interface PostTag {
  tag: { id: string; name: string; slug: string };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { firstName: string | null; lastName: string | null; avatar: string | null };
  replies: Comment[];
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  status: string;
  featured: boolean;
  viewCount: number;
  readingTime: number;
  metaDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  author: Author | null;
  category: { name: string; slug: string } | null;
  tags: PostTag[];
  comments: Comment[];
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  readingTime: number;
  publishedAt: string | null;
  author: Author | null;
  category: { name: string; slug: string } | null;
}

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const viewTracked = useRef(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blog/${slug}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPost(data);

        if (!viewTracked.current) {
          viewTracked.current = true;
          fetch(`/api/blog/${slug}/view`, { method: "POST" }).catch(() => {});
        }

        if (data.category?.slug || data.tags?.length) {
          const relParams = new URLSearchParams({ exclude: data.id, limit: "3" });
          if (data.category?.slug) relParams.set("category", data.category.slug);
          fetch(`/api/blog/related?${relParams}`)
            .then((r) => (r.ok ? r.json() : { posts: [] }))
            .then((d) => setRelatedPosts(d.posts || []))
            .catch(() => {});
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = post?.title || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Post Not Found</h1>
          <p className="text-zinc-500 mb-6">The article you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/blog">
            <Button><ArrowLeft className="w-4 h-4" /> Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const authorName = post.author
    ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "TIMN Editorial"
    : "TIMN Editorial";

  const authorInitials = post.author
    ? `${(post.author.firstName || "T")[0]}${(post.author.lastName || "E")[0]}`
    : "TE";

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-12 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-radial-dark" />
        {post.coverImage && (
          <div className="absolute inset-0 opacity-10">
            <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="container-wide relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-orange-500 transition-colors mb-6 sm:mb-8">
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              {post.category && <Badge>{post.category.name}</Badge>}
              {post.featured && <Badge variant="outline">Featured</Badge>}
              <span className="text-xs text-zinc-500">{post.readingTime} min read</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-zinc-500">
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-500">
                  {authorInitials}
                </div>
                {authorName}
              </span>
              {post.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
              )}
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{post.readingTime} min read</span>
              <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{post.viewCount.toLocaleString()} views</span>
              {post.comments.length > 0 && (
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />{post.comments.length} comments</span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="divider-gradient" />

      {post.coverImage && (
        <section className="bg-zinc-950 -mt-1">
          <div className="container-wide">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="max-w-4xl mx-auto">
              <img src={post.coverImage} alt={post.title} className="w-full rounded-xl shadow-2xl shadow-black/30 mb-8" />
            </motion.div>
          </div>
        </section>
      )}

      {/* Article Body */}
      <section className="section-padding">
        <div className="container-wide">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="max-w-3xl mx-auto">
            <article
              className="prose prose-zinc prose-invert prose-orange max-w-none
                prose-headings:font-display prose-headings:text-white prose-headings:font-bold
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-[17px]
                prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white
                prose-blockquote:border-l-2 prose-blockquote:border-orange-500/50 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-orange-500/80 prose-blockquote:font-medium prose-blockquote:text-lg
                prose-ul:text-zinc-300 prose-ol:text-zinc-300
                prose-code:bg-zinc-800 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:text-orange-400
                prose-pre:bg-zinc-900 prose-pre:rounded-xl prose-pre:border prose-pre:border-zinc-800
                prose-img:rounded-xl prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-zinc-800/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-zinc-500" />
                  {post.tags.map(({ tag }) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">{tag.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="mt-8 pt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-sm text-zinc-500">Enjoyed this article? Share it with others.</div>
              <div className="flex items-center gap-2">
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white" title="Share on X">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white" title="Share on Facebook">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white" title="Share on LinkedIn">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <button onClick={copyLink} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white" title="Copy link">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Author */}
            <div className="mt-8 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-lg font-bold text-orange-500">
                  {authorInitials}
                </div>
                <div>
                  <p className="text-white font-medium font-display">{authorName}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">Contributing writer at The Integrity Man Network</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 p-6 sm:p-8 rounded-xl bg-linear-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
              <h3 className="text-lg font-bold text-white font-display mb-2">Ready to begin your journey?</h3>
              <p className="text-sm text-zinc-400 mb-4">Join The Integrity Man Network and connect with a community of men pursuing purpose with integrity.</p>
              <Link href="/join"><Button size="lg">Join The Network <ChevronRight className="w-4 h-4" /></Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="section-padding border-t border-zinc-800/50">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-white font-display mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedPosts.map((related) => (
                  <Link key={related.id} href={`/blog/${related.slug}`}>
                    <Card variant="light" className="h-full overflow-hidden group hover:border-orange-500/20 transition-all duration-300">
                      <div className="aspect-video bg-zinc-800 flex items-center justify-center overflow-hidden">
                        {related.coverImage ? (
                          <img src={related.coverImage} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <BookOpen className="w-6 h-6 text-zinc-700" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        {related.category && <Badge className="text-[10px] mb-2">{related.category.name}</Badge>}
                        <h3 className="text-sm font-bold text-zinc-900 font-display line-clamp-2 group-hover:text-orange-500 transition-colors">{related.title}</h3>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500">
                          <Clock className="w-2.5 h-2.5" /> {related.readingTime} min read
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
