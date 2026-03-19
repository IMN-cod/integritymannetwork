"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  Eye,
  Edit,
  Trash2,
  FileText,
  ArrowUpDown,
  Clock,
  MessageSquare,
  Globe,
  Archive,
  CheckSquare,
  Square,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  status: string;
  featured: boolean;
  viewCount: number;
  readingTime: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { firstName: string | null; lastName: string | null; avatar: string | null } | null;
  category: { id: string; name: string; slug: string; color: string | null } | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
  _count: { comments: number };
  seoScore?: number;
}

interface Stats {
  total: number;
  draft: number;
  published: number;
  archived: number;
  totalViews: number;
}

const STATUS_TABS = [
  { key: "", label: "All Posts", icon: FileText },
  { key: "PUBLISHED", label: "Published", icon: Globe },
  { key: "DRAFT", label: "Drafts", icon: Edit },
  { key: "ARCHIVED", label: "Archived", icon: Archive },
];

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, draft: 0, published: 0, archived: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        sortBy,
        sortDir,
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/blog?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts || []);
      setStats(data.stats || { total: 0, draft: 0, published: 0, archived: 0, totalViews: 0 });
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p) => p.id)));
    }
  };

  const bulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    if (action === "delete" && !confirm(`Delete ${selectedIds.size} post(s)?`)) return;

    try {
      await fetch("/api/admin/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: Array.from(selectedIds), action }),
      });
      setSelectedIds(new Set());
      setBulkMenuOpen(false);
      fetchPosts();
    } catch {
      alert("Action failed");
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
      fetchPosts();
    } catch {
      alert("Failed to delete");
    }
  };

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "DRAFT": return "bg-amber-50 text-amber-700 border-amber-200";
      case "ARCHIVED": return "bg-gray-100 text-gray-600 border-gray-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getTabCount = (key: string) => {
    switch (key) {
      case "": return stats.total;
      case "PUBLISHED": return stats.published;
      case "DRAFT": return stats.draft;
      case "ARCHIVED": return stats.archived;
      default: return 0;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">Create, manage, and publish your blog content.</p>
        </div>
        <Button onClick={() => router.push("/admin/blog/new")} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Posts", value: stats.total, icon: FileText, color: "text-gray-600", bg: "bg-gray-50" },
          { label: "Published", value: stats.published, icon: Globe, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Drafts", value: stats.draft, icon: Edit, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Archived", value: stats.archived, icon: Archive, color: "text-gray-500", bg: "bg-gray-50" },
          { label: "Total Views", value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              statusFilter === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              statusFilter === tab.key ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"
            }`}>
              {getTabCount(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Bulk Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            variant="admin"
            placeholder="Search by title, content, excerpt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 relative">
            <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                className="text-gray-600"
              >
                Actions <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              {bulkMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBulkMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    <button onClick={() => bulkAction("publish")} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Publish
                    </button>
                    <button onClick={() => bulkAction("draft")} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Edit className="w-3.5 h-3.5" /> Move to Draft
                    </button>
                    <button onClick={() => bulkAction("archive")} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                    <button onClick={() => bulkAction("feature")} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5" /> Feature
                    </button>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={() => bulkAction("delete")} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <Card variant="admin">
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No posts found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {search ? "Try a different search term." : "Create your first blog post to get started."}
            </p>
            {!search && (
              <Button onClick={() => router.push("/admin/blog/new")} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4" /> Create Post
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card variant="admin" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-4 text-left w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                      {selectedIds.size === posts.length && posts.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <button onClick={() => toggleSort("title")} className="flex items-center gap-1.5 font-medium text-gray-500 hover:text-gray-700">
                      Post {sortBy === "title" && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left hidden lg:table-cell font-medium text-gray-500">Category</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                  <th className="py-3 px-4 text-left hidden md:table-cell">
                    <button onClick={() => toggleSort("viewCount")} className="flex items-center gap-1.5 font-medium text-gray-500 hover:text-gray-700">
                      <Eye className="w-3 h-3" /> Views {sortBy === "viewCount" && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left hidden lg:table-cell font-medium text-gray-500">SEO</th>
                  <th className="py-3 px-4 text-left hidden md:table-cell">
                    <button onClick={() => toggleSort("createdAt")} className="flex items-center gap-1.5 font-medium text-gray-500 hover:text-gray-700">
                      Date {sortBy === "createdAt" && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${
                      selectedIds.has(post.id) ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <button onClick={() => toggleSelect(post.id)} className="text-gray-400 hover:text-gray-600">
                        {selectedIds.has(post.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
                          {post.coverImage ? (
                            <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {post.featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                            <Link
                              href={`/admin/blog/${post.id}/edit`}
                              className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate block max-w-75"
                            >
                              {post.title}
                            </Link>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span>
                              {post.author
                                ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "Unknown"
                                : "Unknown"}
                            </span>
                            {post.readingTime > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {post.readingTime}m
                              </span>
                            )}
                            {post._count.comments > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-2.5 h-2.5" /> {post._count.comments}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {post.category ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: `${post.category.color || "#f97316"}15`,
                            color: post.category.color || "#f97316",
                            borderColor: `${post.category.color || "#f97316"}30`,
                          }}
                        >
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                        {post.status.charAt(0) + post.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Eye className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{post.viewCount.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {post.seoScore !== undefined && post.seoScore !== null ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          post.seoScore >= 80 ? "bg-emerald-50 text-emerald-700" :
                          post.seoScore >= 50 ? "bg-amber-50 text-amber-700" :
                          "bg-red-50 text-red-700"
                        }`}>
                          {post.seoScore}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, totalCount)} of {totalCount} posts
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="text-gray-600"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                      page === pageNum
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="text-gray-600"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
