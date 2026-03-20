"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  Search,
  ArrowRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  featured: boolean;
  viewCount: number;
  readingTime: number;
  publishedAt: string;
  author: { firstName: string | null; lastName: string | null; displayName: string | null; avatar: string | null; role?: string } | null;
  category: { name: string; slug: string } | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
  _count?: { comments: number };
}

interface Category {
  name: string;
  slug: string;
  _count?: { posts: number };
}

// ─── HERO ───
function BlogHero() {
  return (
    <section className="relative hero-padding overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-radial-dark" />

      <div className="container-wide relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-5 sm:mb-8">
            <BookOpen className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-orange-500">Insights & Teachings</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95] mb-4 sm:mb-6">
            The <span className="text-gradient">Blog</span>
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Thought-provoking articles, devotionals, and teachings for men pursuing purpose, integrity, and alignment with God&apos;s eternal plan.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FEATURED POST ───
function FeaturedPost({ post }: { post: BlogPost }) {
  const isAdmin = post.author?.role === "ADMIN" || post.author?.role === "SUPER_ADMIN";
  const authorName = isAdmin
    ? "Pastor Eben Darko"
    : post.author
      ? post.author.displayName || `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "TIMN Editorial"
      : "TIMN Editorial";

  return (
    <motion.div {...fadeInUp}>
      <Link href={`/blog/${post.slug}`}>
        <Card variant="light" className="overflow-hidden group hover:border-orange-500/20 transition-all duration-500">
          <div className="h-1.5 bg-linear-to-r from-orange-500 via-orange-400 to-orange-600" />
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="aspect-16/10 lg:aspect-auto bg-white/5 relative flex items-center justify-center border-b lg:border-b-0 lg:border-r border-zinc-200 overflow-hidden">
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-xs text-zinc-600">Featured Article</p>
                  </div>
                )}
              </div>

              <div className="p-5 sm:p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {post.category && <Badge>{post.category.name}</Badge>}
                  <Badge variant="outline">Featured</Badge>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 font-display mb-3 sm:mb-4 group-hover:text-orange-500 transition-colors">
                  {post.title}
                </h2>

                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed mb-4 sm:mb-6">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{authorName}</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{post.readingTime} min read</span>
                  {post.viewCount > 0 && (
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{post.viewCount.toLocaleString()} views</span>
                  )}
                </div>

                <div className="mt-4 sm:mt-6">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-orange-500 group-hover:gap-3 transition-all">
                    Read Article
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

// ─── POST CARD ───
function PostCard({ post }: { post: BlogPost }) {
  const isAdmin = post.author?.role === "ADMIN" || post.author?.role === "SUPER_ADMIN";
  const authorName = isAdmin
    ? "Pastor Eben Darko"
    : post.author
      ? post.author.displayName || `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "TIMN Editorial"
      : "TIMN Editorial";

  return (
    <Link href={`/blog/${post.slug}`}>
      <Card variant="light" className="h-full overflow-hidden group hover:border-orange-500/20 transition-all duration-300">
        <div className="aspect-video bg-white/5 relative flex items-center justify-center overflow-hidden">
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <BookOpen className="w-8 h-8 text-zinc-700" />
          )}
        </div>

        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            {post.category && <Badge className="text-[10px]">{post.category.name}</Badge>}
            <span className="text-[10px] text-zinc-500">{post.readingTime} min read</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-zinc-900 font-display mb-2 sm:mb-3 line-clamp-2 group-hover:text-orange-500 transition-colors">
            {post.title}
          </h3>

          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><User className="w-3 h-3" />{authorName}</span>
            <div className="flex items-center gap-3">
              {post.viewCount > 0 && (
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount}</span>
              )}
              <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── MAIN PAGE ───
export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Fetch categories
  useEffect(() => {
    fetch("/api/blog/categories")
      .then((r) => r.ok ? r.json() : { categories: [] })
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // Fetch featured post
  useEffect(() => {
    fetch("/api/blog?featured=true&limit=1")
      .then((r) => r.ok ? r.json() : { posts: [] })
      .then((d) => setFeaturedPost(d.posts?.[0] || null))
      .catch(() => {});
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "9" });
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/blog?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const allCategories = [{ name: "All", slug: "all" }, ...categories];

  return (
    <>
      <BlogHero />
      <div className="divider-gradient" />

      <section className="section-padding">
        <div className="container-wide">
          {/* Featured Post */}
          {featuredPost && page === 1 && activeCategory === "all" && !searchQuery && (
            <div className="mb-10 sm:mb-16">
              <FeaturedPost post={featuredPost} />
            </div>
          )}

          {/* Filters */}
          <motion.div {...fadeInUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 mb-8 sm:mb-10">
            <div className="flex overflow-x-auto gap-2 pb-1 -mx-1 px-1 scrollbar-hide">
              {allCategories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    activeCategory === cat.slug
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "bg-zinc-800/50 text-zinc-400 hover:text-white border border-zinc-700/50 hover:border-zinc-600"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </motion.div>

          {/* Posts Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <span className="text-sm text-zinc-500">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 mb-2">No articles found.</p>
              <p className="text-sm text-zinc-600 mb-4">
                {searchQuery
                  ? "Try a different search term."
                  : "Check back soon for new content."}
              </p>
              {(searchQuery || activeCategory !== "all") && (
                <Button variant="outline" onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
