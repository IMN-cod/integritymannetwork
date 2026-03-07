"use client";

import { useState, useEffect, useCallback } from "react";
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
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  featured: boolean;
  createdAt: string;
  author: { firstName: string | null; lastName: string | null } | null;
  _count: { comments: number };
}

const STATUSES = ["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"];

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", excerpt: "", status: "DRAFT" });
  const [saving, setSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/blog?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openCreate = () => {
    setEditingPost(null);
    setFormData({ title: "", content: "", excerpt: "", status: "DRAFT" });
    setShowModal(true);
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({ title: post.title, content: "", excerpt: post.excerpt || "", status: post.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingPost) {
        await fetch("/api/admin/blog", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: editingPost.id, ...formData }),
        });
      } else {
        await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      fetchPosts();
    } catch {
      alert("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (post: Post) => {
    await fetch("/api/admin/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, featured: !post.featured }),
    });
    fetchPosts();
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch("/api/admin/blog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    fetchPosts();
  };

  const statusBadge = (status: string) => {
    const v: Record<string, "success" | "warning" | "secondary"> = { PUBLISHED: "success", DRAFT: "warning", ARCHIVED: "secondary" };
    return <Badge variant={v[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage blog content.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> New Post</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input variant="admin" placeholder="Search posts..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700">
          {STATUSES.map((s) => <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>
      ) : posts.length === 0 ? (
        <Card variant="admin"><CardContent className="py-16 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No posts found</p>
        </CardContent></Card>
      ) : (
        <Card variant="admin">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">Author</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {post.featured && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                        <span className="font-medium text-gray-900 truncate max-w-62.5">{post.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">
                      {post.author ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || "Unknown" : "Unknown"}
                    </td>
                    <td className="py-3 px-4">{statusBadge(post.status)}</td>
                    <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleFeatured(post)} className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="Toggle featured">
                          <Star className={`w-3.5 h-3.5 ${post.featured ? "text-yellow-500 fill-yellow-500" : "text-gray-500"}`} />
                        </button>
                        <Link href={`/blog/${post.slug}`} className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                        </Link>
                        <button onClick={() => openEdit(post)} className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="Edit">
                          <Edit className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button onClick={() => deletePost(post.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /> Previous</Button>
            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next <ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingPost ? "Edit Post" : "New Post"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Title</label>
                <Input variant="admin" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Content</label>
                <Textarea variant="admin" rows={6} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Excerpt</label>
                <Textarea variant="admin" rows={2} value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formData.title}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingPost ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
