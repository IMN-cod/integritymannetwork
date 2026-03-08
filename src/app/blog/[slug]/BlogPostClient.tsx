"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  ArrowLeft,
  BookOpen,
  Tag,
  Eye,
  MessageSquare,
  ChevronRight,
  Link2,
  CheckCircle2,
  ChevronUp,
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

// Extract table of contents from HTML
function extractToc(html: string) {
  const regex = /<h([2-3])[^>]*>(.*?)<\/h[2-3]>/gi;
  const toc: { level: number; text: string; id: string }[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s]+/g, "-");
    toc.push({ level: parseInt(match[1]), text, id });
  }
  return toc;
}

// Add IDs to headings in HTML
function addHeadingIds(html: string) {
  return html.replace(/<h([2-3])([^>]*)>(.*?)<\/h([2-3])>/gi, (_, level, attrs, content, closeLevel) => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s]+/g, "-");
    return `<h${level}${attrs} id="${id}">${content}</h${closeLevel}>`;
  });
}

export default function BlogPostClient({
  post,
  relatedPosts,
}: {
  post: BlogPost;
  relatedPosts: RelatedPost[];
}) {
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTocId, setActiveTocId] = useState("");
  const articleRef = useRef<HTMLDivElement>(null);
  const viewTracked = useRef(false);

  const toc = extractToc(post.content);
  const processedContent = addHeadingIds(post.content);

  // Track view
  useEffect(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      fetch(`/api/blog/${post.slug}/view`, { method: "POST" }).catch(() => {});
    }
  }, [post.slug]);

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      const rect = articleRef.current.getBoundingClientRect();
      const articleTop = rect.top + window.scrollY;
      const articleHeight = articleRef.current.offsetHeight;
      const scrolled = window.scrollY - articleTop;
      const viewportHeight = window.innerHeight;
      const totalScrollable = articleHeight - viewportHeight;
      const pct = Math.min(100, Math.max(0, (scrolled / totalScrollable) * 100));
      setProgress(pct);
      setShowScrollTop(window.scrollY > 500);

      // Active TOC heading
      const headings = articleRef.current.querySelectorAll("h2, h3");
      let current = "";
      headings.forEach((h) => {
        const el = h as HTMLElement;
        if (el.getBoundingClientRect().top <= 100) {
          current = el.id;
        }
      });
      setActiveTocId(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = post.title;

  const authorName = post.author
    ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "TIMN Editorial"
    : "TIMN Editorial";

  const authorInitials = post.author
    ? `${(post.author.firstName || "T")[0]}${(post.author.lastName || "E")[0]}`
    : "TE";

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-900/50">
        <motion.div
          className="h-full bg-linear-to-r from-orange-500 to-orange-400"
          style={{ width: `${progress}%` }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
      </div>

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
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6 sm:mb-8">
              <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-orange-500 transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-zinc-400 truncate max-w-60">{post.title}</span>
            </nav>
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

      {/* Article Body with TOC */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="max-w-6xl mx-auto flex gap-8">
            {/* Table of Contents — Desktop Sidebar */}
            {toc.length > 2 && (
              <aside className="hidden xl:block w-56 shrink-0">
                <div className="sticky top-20">
                  <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Contents</h4>
                  <nav className="space-y-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-sm transition-colors ${
                          item.level === 3 ? "pl-3" : ""
                        } ${
                          activeTocId === item.id
                            ? "text-orange-500 font-medium"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}

            {/* Main */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex-1 min-w-0 max-w-3xl mx-auto" ref={articleRef}>
              <article
                className="prose prose-zinc prose-invert prose-orange max-w-none
                  prose-headings:font-display prose-headings:text-white prose-headings:font-bold prose-headings:scroll-mt-20
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
                dangerouslySetInnerHTML={{ __html: processedContent }}
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
                  <a href={`https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white" title="Share on WhatsApp">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
          title="Back to top"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </>
  );
}
