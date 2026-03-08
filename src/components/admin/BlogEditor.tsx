"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  ImageIcon,
  Tag,
  FolderOpen,
  X,
  Plus,
  Globe,
  Clock,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Calendar,
  Star,
  Search,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { calculateReadingTime, generateExcerpt } from "@/components/admin/RichTextEditor";

const RichTextEditor = dynamic(() => import("@/components/admin/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-xl bg-white">
      <div className="h-12 bg-gray-50 border-b border-gray-200 rounded-t-xl animate-pulse" />
      <div className="min-h-[400px] p-6">
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  ),
});

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface TagItem {
  id: string;
  name: string;
  slug: string;
}

interface PostData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  categoryId: string;
  tagIds: string[];
  status: string;
  featured: boolean;
  metaDescription: string;
  scheduledAt: string;
}

const INITIAL_POST: PostData = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  coverImage: "",
  categoryId: "",
  tagIds: [],
  status: "DRAFT",
  featured: false,
  metaDescription: "",
  scheduledAt: "",
};

export default function BlogEditorPage({ postId }: { postId?: string }) {
  const router = useRouter();
  const [post, setPost] = useState<PostData>(INITIAL_POST);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "scheduling">("general");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  // Fetch categories and tags
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch("/api/admin/blog/categories"),
          fetch("/api/admin/blog/tags"),
        ]);
        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories || []);
        }
        if (tagRes.ok) {
          const data = await tagRes.json();
          setAvailableTags(data.tags || []);
        }
      } catch {
        // Silent fail
      }
    };
    fetchMeta();
  }, []);

  // Fetch existing post for editing
  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/blog/${postId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const p = data.post;
        setPost({
          id: p.id,
          title: p.title,
          slug: p.slug,
          content: p.content || "",
          excerpt: p.excerpt || "",
          coverImage: p.coverImage || "",
          categoryId: p.categoryId || "",
          tagIds: (p.tags || []).map((t: { tagId: string }) => t.tagId),
          status: p.status,
          featured: p.featured,
          metaDescription: p.metaDescription || "",
          scheduledAt: p.scheduledAt ? new Date(p.scheduledAt).toISOString().slice(0, 16) : "",
        });
        lastSavedRef.current = JSON.stringify(p);
      } catch {
        alert("Failed to load post");
        router.push("/admin/blog");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId, router]);

  // Auto-generate slug from title
  const updateTitle = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setPost((prev) => ({ ...prev, title, slug: prev.id ? prev.slug : slug }));
  };

  // Auto-generate excerpt from content
  const handleContentChange = useCallback(
    (html: string) => {
      setPost((prev) => {
        const newPost = { ...prev, content: html };
        // Auto-generate excerpt if empty
        if (!prev.excerpt && html.length > 50) {
          newPost.excerpt = generateExcerpt(html, 160);
        }
        return newPost;
      });

      // Auto-save after 5 seconds of inactivity (drafts only)
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (post.status === "DRAFT" && post.id) {
        autoSaveTimerRef.current = setTimeout(() => {
          handleSave(true);
        }, 5000);
      }
    },
    [post.status, post.id]
  );

  // AI-powered excerpt generation
  const generateSmartExcerpt = () => {
    if (!post.content) return;
    const excerpt = generateExcerpt(post.content, 160);
    setPost((prev) => ({ ...prev, excerpt }));
  };

  // AI-powered meta description
  const generateMetaDescription = () => {
    if (!post.content) return;
    const desc = generateExcerpt(post.content, 155);
    setPost((prev) => ({ ...prev, metaDescription: desc }));
  };

  // Save post
  const handleSave = async (isAutoSave = false) => {
    if (!post.title || !post.content) {
      if (!isAutoSave) alert("Title and content are required");
      return;
    }

    setSaving(true);
    setSaveStatus("saving");

    try {
      const readingTime = calculateReadingTime(post.content);
      const body = {
        ...post,
        readingTime,
        excerpt: post.excerpt || generateExcerpt(post.content, 160),
        scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString() : null,
      };

      let res: Response;
      if (post.id) {
        res = await fetch(`/api/admin/blog/${post.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const data = await res.json();
      if (!post.id && data.post?.id) {
        setPost((prev) => ({ ...prev, id: data.post.id }));
        // Update URL without navigating
        window.history.replaceState(null, "", `/admin/blog/${data.post.id}/edit`);
      }

      setSaveStatus("saved");
      lastSavedRef.current = JSON.stringify(data.post);

      if (!isAutoSave && !post.id) {
        // New post created - stay on page
      }

      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      if (!isAutoSave) alert(err instanceof Error ? err.message : "Failed to save post");
      setTimeout(() => setSaveStatus("idle"), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Publish
  const handlePublish = async () => {
    setPost((prev) => ({ ...prev, status: "PUBLISHED" }));
    // Need to wait for state update then save
    setTimeout(async () => {
      await handleSave();
    }, 100);
  };

  // Create category inline
  const createCategory = async () => {
    if (!newCategoryName) return;
    try {
      const res = await fetch("/api/admin/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories((prev) => [...prev, data.category]);
        setPost((prev) => ({ ...prev, categoryId: data.category.id }));
        setNewCategoryName("");
        setShowCategoryInput(false);
      }
    } catch {
      alert("Failed to create category");
    }
  };

  // Create tag inline
  const createTag = async () => {
    if (!newTagName) return;
    try {
      const res = await fetch("/api/admin/blog/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName }),
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableTags((prev) => [...prev, data.tag]);
        setPost((prev) => ({ ...prev, tagIds: [...prev.tagIds, data.tag.id] }));
        setNewTagName("");
        setShowTagInput(false);
      }
    } catch {
      alert("Failed to create tag");
    }
  };

  const toggleTag = (tagId: string) => {
    setPost((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const readingTime = post.content ? calculateReadingTime(post.content) : 0;
  const wordCount = post.content
    ? post.content.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen -m-6 -mt-6">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/blog")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 font-display">
                {post.id ? "Edit Post" : "New Post"}
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                    <CheckCircle2 className="w-3 h-3" /> Saved
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="flex items-center gap-1.5 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3" /> Save failed
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {wordCount} words · {readingTime} min read
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-gray-600"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? "Editor" : "Preview"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSave()}
              disabled={saving}
              className="text-gray-600"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={saving || !post.title || !post.content}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {post.status === "PUBLISHED" ? "Update" : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Editor Area */}
        <div className="flex-1 min-w-0 p-6">
          {/* Title */}
          <input
            type="text"
            placeholder="Post title..."
            value={post.title}
            onChange={(e) => updateTitle(e.target.value)}
            className="w-full text-3xl md:text-4xl font-bold text-gray-900 font-display placeholder-gray-300 border-none outline-none bg-transparent mb-2"
          />

          {/* Slug */}
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
            <Globe className="w-3.5 h-3.5" />
            <span>/blog/</span>
            <input
              type="text"
              value={post.slug}
              onChange={(e) => setPost((prev) => ({ ...prev, slug: e.target.value }))}
              className="border-none outline-none bg-transparent text-gray-600 min-w-[200px]"
            />
          </div>

          {/* Cover Image */}
          {post.coverImage ? (
            <div className="relative mb-6 rounded-xl overflow-hidden group">
              <img
                src={post.coverImage}
                alt="Cover"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    const url = prompt("Change cover image URL:", post.coverImage);
                    if (url !== null) setPost((prev) => ({ ...prev, coverImage: url }));
                  }}
                  className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-900"
                >
                  Change
                </button>
                <button
                  onClick={() => setPost((prev) => ({ ...prev, coverImage: "" }))}
                  className="px-4 py-2 bg-red-500 rounded-lg text-sm font-medium text-white"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                const url = prompt("Enter cover image URL:");
                if (url) setPost((prev) => ({ ...prev, coverImage: url }));
              }}
              className="w-full mb-6 border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-orange-500/30 hover:bg-orange-50/30 transition-all cursor-pointer group"
            >
              <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-orange-400 transition-colors" />
              <span className="text-sm text-gray-400 group-hover:text-orange-500 transition-colors">
                Add cover image
              </span>
            </button>
          )}

          {/* Editor / Preview */}
          {showPreview ? (
            <div className="border border-gray-200 rounded-xl bg-white p-8">
              <h1 className="text-3xl font-bold text-gray-900 font-display mb-4">{post.title || "Untitled"}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{readingTime} min read</span>
                <span>{wordCount} words</span>
              </div>
              <article
                className="prose prose-gray max-w-none prose-headings:font-display prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-orange-600 prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          ) : (
            <RichTextEditor
              content={post.content}
              onChange={handleContentChange}
              placeholder="Write your post content here... Use the toolbar above for formatting."
            />
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-gray-200 bg-gray-50/50 p-5 space-y-5 shrink-0 overflow-y-auto max-h-[calc(100vh-65px)] sticky top-[65px]">
          {/* Tab Navigation */}
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            {(["general", "seo", "scheduling"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "general" && (
            <>
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={post.status}
                  onChange={(e) => setPost((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {/* Featured */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    post.featured ? "bg-orange-500" : "bg-gray-200"
                  }`}
                  onClick={() => setPost((prev) => ({ ...prev, featured: !prev.featured }))}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      post.featured ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <div>
                  <span className="text-sm text-gray-700 font-medium">Featured Post</span>
                  <p className="text-xs text-gray-400">Highlighted on the blog page</p>
                </div>
              </label>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Category
                </label>
                {!showCategoryInput ? (
                  <div className="space-y-2">
                    <select
                      value={post.categoryId}
                      onChange={(e) => setPost((prev) => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
                    >
                      <option value="">No category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowCategoryInput(true)}
                      className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> New Category
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      variant="admin"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="h-9 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && createCategory()}
                    />
                    <Button size="sm" onClick={createCategory} className="h-9 px-3 shrink-0">
                      <Plus className="w-3 h-3" />
                    </Button>
                    <button onClick={() => setShowCategoryInput(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        post.tagIds.includes(tag.id)
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
                {!showTagInput ? (
                  <button
                    onClick={() => setShowTagInput(true)}
                    className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> New Tag
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      variant="admin"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Tag name"
                      className="h-9 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && createTag()}
                    />
                    <Button size="sm" onClick={createTag} className="h-9 px-3 shrink-0">
                      <Plus className="w-3 h-3" />
                    </Button>
                    <button onClick={() => setShowTagInput(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Excerpt
                  </label>
                  <button
                    onClick={generateSmartExcerpt}
                    className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 transition-colors"
                    title="Auto-generate from content"
                  >
                    <Wand2 className="w-3 h-3" /> Generate
                  </button>
                </div>
                <Textarea
                  variant="admin"
                  rows={3}
                  value={post.excerpt}
                  onChange={(e) => setPost((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief summary of the post..."
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">{post.excerpt.length}/160 characters</p>
              </div>
            </>
          )}

          {activeTab === "seo" && (
            <>
              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meta Description
                  </label>
                  <button
                    onClick={generateMetaDescription}
                    className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    <Wand2 className="w-3 h-3" /> Generate
                  </button>
                </div>
                <Textarea
                  variant="admin"
                  rows={3}
                  value={post.metaDescription}
                  onChange={(e) => setPost((prev) => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="SEO description for search engines..."
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">{post.metaDescription.length}/155 characters</p>
              </div>

              {/* SEO Preview */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Search Preview
                </label>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-blue-700 text-sm font-medium truncate">
                    {post.title || "Post Title"} | TIMN Blog
                  </p>
                  <p className="text-emerald-700 text-xs truncate mt-0.5">
                    integritymannetwork.com/blog/{post.slug || "post-slug"}
                  </p>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                    {post.metaDescription || post.excerpt || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  URL Slug
                </label>
                <Input
                  variant="admin"
                  value={post.slug}
                  onChange={(e) => setPost((prev) => ({ ...prev, slug: e.target.value }))}
                  className="text-sm"
                />
              </div>

              {/* Post Stats */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Content Stats
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Words</span>
                    <span className="font-medium text-gray-900">{wordCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Characters</span>
                    <span className="font-medium text-gray-900">
                      {post.content.replace(/<[^>]*>/g, "").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Reading Time</span>
                    <span className="font-medium text-gray-900">{readingTime} min</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "scheduling" && (
            <>
              {/* Schedule */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Schedule Publish
                </label>
                <Input
                  variant="admin"
                  type="datetime-local"
                  value={post.scheduledAt}
                  onChange={(e) => setPost((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Leave empty to publish immediately when status is set to Published.
                </p>
              </div>

              {/* Status Timeline */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Publishing Info
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${post.status === "DRAFT" ? "bg-yellow-400" : post.status === "PUBLISHED" ? "bg-emerald-400" : "bg-gray-400"}`} />
                    <span className="text-sm text-gray-700">
                      Status: <span className="font-medium">{post.status}</span>
                    </span>
                  </div>
                  {post.scheduledAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-sm text-gray-700">
                        Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {post.featured && (
                    <div className="flex items-center gap-3">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-gray-700">Featured post</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
