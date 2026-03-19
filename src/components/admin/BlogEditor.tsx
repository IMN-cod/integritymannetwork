"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  X,
  Plus,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Star,
  Wand2,
  Search as SearchIcon,
  Target,
  Shield,
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronUp,
  Hash,
  Type,
  Link2,
  Image as ImageLucide,
  Heading,
  ListChecks,
  Gauge,
  CircleCheck,
  CircleAlert,
  CircleX,
  Twitter,
  Facebook,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { calculateReadingTime, generateExcerpt } from "@/components/admin/RichTextEditor";
import { ImageUpload } from "@/components/ui/ImageUpload";

const RichTextEditor = dynamic(() => import("@/components/admin/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-xl bg-white">
      <div className="h-12 bg-gray-50 border-b border-gray-200 rounded-t-xl animate-pulse" />
      <div className="min-h-100 p-6">
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  ),
});

interface Category { id: string; name: string; slug: string; }
interface TagItem { id: string; name: string; slug: string; }

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
  scheduledAt: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogImage: string;
  ogTitle: string;
  ogDescription: string;
  twitterImage: string;
  noIndex: boolean;
  noFollow: boolean;
  seoScore: number;
}

const INITIAL_POST: PostData = {
  title: "", slug: "", content: "", excerpt: "", coverImage: "", categoryId: "",
  tagIds: [], status: "DRAFT", featured: false, scheduledAt: "",
  seoTitle: "", metaDescription: "", focusKeyword: "", canonicalUrl: "",
  ogImage: "", ogTitle: "", ogDescription: "", twitterImage: "",
  noIndex: false, noFollow: false, seoScore: 0,
};

// ── SEO Score Calculator ──
interface SeoCheck { id: string; label: string; status: "pass" | "warning" | "fail"; message: string; weight: number; }

function calculateSeoScore(post: PostData): { score: number; checks: SeoCheck[] } {
  const checks: SeoCheck[] = [];
  const title = post.seoTitle || post.title;
  const description = post.metaDescription;
  const keyword = post.focusKeyword.toLowerCase().trim();
  const textContent = post.content.replace(/<[^>]*>/g, "").toLowerCase();
  const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;

  // 1. Title length
  if (title.length === 0) checks.push({ id: "title-length", label: "SEO Title", status: "fail", message: "No title set", weight: 15 });
  else if (title.length < 30) checks.push({ id: "title-length", label: "SEO Title", status: "warning", message: `Too short (${title.length}/30-60 chars)`, weight: 8 });
  else if (title.length > 60) checks.push({ id: "title-length", label: "SEO Title", status: "warning", message: `Too long (${title.length}/60 max)`, weight: 8 });
  else checks.push({ id: "title-length", label: "SEO Title", status: "pass", message: `Good length (${title.length} chars)`, weight: 15 });

  // 2. Meta description
  if (!description) checks.push({ id: "meta-desc", label: "Meta Description", status: "fail", message: "No description set", weight: 15 });
  else if (description.length < 120) checks.push({ id: "meta-desc", label: "Meta Description", status: "warning", message: `Too short (${description.length}/120-155)`, weight: 8 });
  else if (description.length > 155) checks.push({ id: "meta-desc", label: "Meta Description", status: "warning", message: `Too long (${description.length}/155 max)`, weight: 8 });
  else checks.push({ id: "meta-desc", label: "Meta Description", status: "pass", message: `Good length (${description.length} chars)`, weight: 15 });

  // 3. Focus keyword
  if (!keyword) checks.push({ id: "focus-kw", label: "Focus Keyword", status: "fail", message: "No focus keyword set", weight: 10 });
  else checks.push({ id: "focus-kw", label: "Focus Keyword", status: "pass", message: `Set: "${post.focusKeyword}"`, weight: 10 });

  // 4. Keyword in title
  if (keyword && title.toLowerCase().includes(keyword)) checks.push({ id: "kw-title", label: "Keyword in Title", status: "pass", message: "Found in title", weight: 10 });
  else if (keyword) checks.push({ id: "kw-title", label: "Keyword in Title", status: "fail", message: "Not found in title", weight: 0 });

  // 5. Keyword in meta description
  if (keyword && description && description.toLowerCase().includes(keyword)) checks.push({ id: "kw-meta", label: "Keyword in Description", status: "pass", message: "Found in description", weight: 5 });
  else if (keyword && description) checks.push({ id: "kw-meta", label: "Keyword in Description", status: "warning", message: "Not in description", weight: 2 });

  // 6. Keyword in first paragraph
  const firstParagraph = post.content.replace(/<\/p>[\s\S]*/, "").replace(/<[^>]*>/g, "").toLowerCase();
  if (keyword && firstParagraph.includes(keyword)) checks.push({ id: "kw-intro", label: "Keyword in Introduction", status: "pass", message: "Found in first paragraph", weight: 8 });
  else if (keyword) checks.push({ id: "kw-intro", label: "Keyword in Introduction", status: "warning", message: "Not in first paragraph", weight: 3 });

  // 7. Keyword density
  if (keyword && wordCount > 0) {
    const kwWords = keyword.split(/\s+/).length;
    let count = 0;
    const words = textContent.split(/\s+/);
    for (let i = 0; i <= words.length - kwWords; i++) {
      if (words.slice(i, i + kwWords).join(" ").includes(keyword)) count++;
    }
    const density = (count / wordCount) * 100;
    if (density < 0.5) checks.push({ id: "kw-density", label: "Keyword Density", status: "warning", message: `Low (${density.toFixed(1)}% — aim 1-2%)`, weight: 3 });
    else if (density > 3) checks.push({ id: "kw-density", label: "Keyword Density", status: "warning", message: `High (${density.toFixed(1)}% — under 3%)`, weight: 3 });
    else checks.push({ id: "kw-density", label: "Keyword Density", status: "pass", message: `Good (${density.toFixed(1)}%)`, weight: 7 });
  }

  // 8. Content length
  if (wordCount < 300) checks.push({ id: "word-count", label: "Content Length", status: "fail", message: `Short (${wordCount} — min 300)`, weight: 0 });
  else if (wordCount < 600) checks.push({ id: "word-count", label: "Content Length", status: "warning", message: `Fair (${wordCount} — aim 1000+)`, weight: 5 });
  else if (wordCount >= 1000) checks.push({ id: "word-count", label: "Content Length", status: "pass", message: `Great (${wordCount} words)`, weight: 10 });
  else checks.push({ id: "word-count", label: "Content Length", status: "pass", message: `Good (${wordCount} words)`, weight: 8 });

  // 9. Headings
  const hasH2 = /<h2[\s>]/i.test(post.content);
  const hasH3 = /<h3[\s>]/i.test(post.content);
  if (hasH2 && hasH3) checks.push({ id: "headings", label: "Heading Structure", status: "pass", message: "H2 + H3 found", weight: 5 });
  else if (hasH2) checks.push({ id: "headings", label: "Heading Structure", status: "pass", message: "H2 headings found", weight: 4 });
  else checks.push({ id: "headings", label: "Heading Structure", status: "warning", message: "No subheadings (H2/H3)", weight: 1 });

  // 10. Keyword in headings
  if (keyword) {
    const headings = (post.content.match(/<h[2-3][^>]*>([^<]*)<\/h[2-3]>/gi) || []).map((h) => h.replace(/<[^>]*>/g, "").toLowerCase());
    if (headings.some((h) => h.includes(keyword))) checks.push({ id: "kw-heading", label: "Keyword in Headings", status: "pass", message: "Found in subheading", weight: 5 });
    else checks.push({ id: "kw-heading", label: "Keyword in Headings", status: "warning", message: "Not in any subheading", weight: 2 });
  }

  // 11. Images
  const imageCount = (post.content.match(/<img[\s]/gi) || []).length;
  const hasCover = !!post.coverImage;
  if (hasCover && imageCount > 0) checks.push({ id: "images", label: "Images", status: "pass", message: `Cover + ${imageCount} content`, weight: 5 });
  else if (hasCover || imageCount > 0) checks.push({ id: "images", label: "Images", status: "pass", message: hasCover ? "Cover image set" : `${imageCount} image(s)`, weight: 4 });
  else checks.push({ id: "images", label: "Images", status: "warning", message: "No images", weight: 1 });

  // 12. Internal links
  const internalLinks = (post.content.match(/href=["'][^"']*\/(blog|about|events|store|community|channels)[^"']*/gi) || []).length;
  if (internalLinks > 0) checks.push({ id: "internal-links", label: "Internal Links", status: "pass", message: `${internalLinks} internal link(s)`, weight: 5 });
  else checks.push({ id: "internal-links", label: "Internal Links", status: "warning", message: "No internal links", weight: 1 });

  // 13. URL slug
  if (post.slug && post.slug.length < 75 && !post.slug.includes("--")) {
    if (keyword && post.slug.includes(keyword.replace(/\s+/g, "-"))) checks.push({ id: "slug", label: "URL Slug", status: "pass", message: "Clean & has keyword", weight: 5 });
    else checks.push({ id: "slug", label: "URL Slug", status: "pass", message: "Clean URL slug", weight: 3 });
  } else if (post.slug) checks.push({ id: "slug", label: "URL Slug", status: "warning", message: "Shorten/clean slug", weight: 2 });

  const totalPossible = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter((c) => c.status === "pass").reduce((s, c) => s + c.weight, 0)
    + checks.filter((c) => c.status === "warning").reduce((s, c) => s + c.weight, 0);
  const score = totalPossible > 0 ? Math.round((earned / totalPossible) * 100) : 0;
  return { score, checks };
}

function getSeoColor(score: number) {
  if (score >= 80) return { text: "text-emerald-600", bg: "bg-emerald-50", stroke: "stroke-emerald-500" };
  if (score >= 50) return { text: "text-amber-600", bg: "bg-amber-50", stroke: "stroke-amber-500" };
  return { text: "text-red-600", bg: "bg-red-50", stroke: "stroke-red-500" };
}

function getSeoLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

function ScoreCircle({ score, size = 80 }: { score: number; size?: number }) {
  const c = getSeoColor(score);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} className={`${c.stroke} transition-all duration-1000`} />
      </svg>
      <span className={`absolute text-lg font-bold ${c.text}`}>{score}</span>
    </div>
  );
}

function CheckIcon({ status }: { status: "pass" | "warning" | "fail" }) {
  if (status === "pass") return <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />;
  if (status === "warning") return <CircleAlert className="w-4 h-4 text-amber-500 shrink-0" />;
  return <CircleX className="w-4 h-4 text-red-500 shrink-0" />;
}

// ══════════════════════════════════════════════════════════
// MAIN EDITOR
// ══════════════════════════════════════════════════════════

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
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "social" | "advanced">("general");
  const [serpPreview, setSerpPreview] = useState<"desktop" | "mobile">("desktop");
  const [seoExpanded, setSeoExpanded] = useState(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const seoResult = useMemo(() => calculateSeoScore(post), [post]);

  // Fetch categories + tags
  useEffect(() => {
    (async () => {
      try {
        const [catRes, tagRes] = await Promise.all([fetch("/api/admin/blog/categories"), fetch("/api/admin/blog/tags")]);
        if (catRes.ok) { const d = await catRes.json(); setCategories(d.categories || []); }
        if (tagRes.ok) { const d = await tagRes.json(); setAvailableTags(d.tags || []); }
      } catch { /* silent */ }
    })();
  }, []);

  // Fetch existing post
  useEffect(() => {
    if (!postId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/blog/${postId}`);
        if (!res.ok) throw new Error();
        const { post: p } = await res.json();
        setPost({
          id: p.id, title: p.title, slug: p.slug, content: p.content || "", excerpt: p.excerpt || "",
          coverImage: p.coverImage || "", categoryId: p.categoryId || "",
          tagIds: (p.tags || []).map((t: { tagId: string }) => t.tagId),
          status: p.status, featured: p.featured,
          scheduledAt: p.scheduledAt ? new Date(p.scheduledAt).toISOString().slice(0, 16) : "",
          seoTitle: p.seoTitle || "", metaDescription: p.metaDescription || "",
          focusKeyword: p.focusKeyword || "", canonicalUrl: p.canonicalUrl || "",
          ogImage: p.ogImage || "", ogTitle: p.ogTitle || "", ogDescription: p.ogDescription || "",
          twitterImage: p.twitterImage || "", noIndex: p.noIndex || false, noFollow: p.noFollow || false,
          seoScore: p.seoScore || 0,
        });
        lastSavedRef.current = JSON.stringify(p);
      } catch {
        alert("Failed to load post");
        router.push("/admin/blog");
      } finally { setLoading(false); }
    })();
  }, [postId, router]);

  const updateTitle = (title: string) => {
    const slug = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
    setPost((prev) => ({ ...prev, title, slug: prev.id ? prev.slug : slug }));
  };

  const handleContentChange = useCallback((html: string) => {
    setPost((prev) => {
      const np = { ...prev, content: html };
      if (!prev.excerpt && html.length > 50) np.excerpt = generateExcerpt(html, 160);
      return np;
    });
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (post.status === "DRAFT" && post.id) {
      autoSaveTimerRef.current = setTimeout(() => { handleSave(true); }, 8000);
    }
  }, [post.status, post.id]);

  const generateSmartExcerpt = () => { if (post.content) setPost((prev) => ({ ...prev, excerpt: generateExcerpt(post.content, 160) })); };
  const generateMetaDescription = () => { if (post.content) setPost((prev) => ({ ...prev, metaDescription: generateExcerpt(post.content, 155) })); };
  const generateSeoTitle = () => { if (post.title) setPost((prev) => ({ ...prev, seoTitle: post.title.length > 60 ? post.title.slice(0, 57) + "..." : post.title })); };

  // File upload
  // Save
  const handleSave = async (isAutoSave = false) => {
    if (!post.title || !post.content) { if (!isAutoSave) alert("Title and content are required"); return; }
    setSaving(true); setSaveStatus("saving");
    try {
      const readingTime = calculateReadingTime(post.content);
      const body = { ...post, readingTime, seoScore: seoResult.score, excerpt: post.excerpt || generateExcerpt(post.content, 160), scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString() : null };
      const res = post.id
        ? await fetch(`/api/admin/blog/${post.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to save"); }
      const data = await res.json();
      if (!post.id && data.post?.id) { setPost((prev) => ({ ...prev, id: data.post.id })); window.history.replaceState(null, "", `/admin/blog/${data.post.id}/edit`); }
      setSaveStatus("saved"); lastSavedRef.current = JSON.stringify(data.post);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error"); if (!isAutoSave) alert(err instanceof Error ? err.message : "Failed to save post");
      setTimeout(() => setSaveStatus("idle"), 5000);
    } finally { setSaving(false); }
  };

  const handlePublish = async () => {
    setPost((prev) => ({ ...prev, status: "PUBLISHED" }));
    setTimeout(async () => { await handleSave(); }, 100);
  };

  const createCategory = async () => {
    if (!newCategoryName) return;
    try {
      const res = await fetch("/api/admin/blog/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCategoryName }) });
      if (res.ok) { const d = await res.json(); setCategories((prev) => [...prev, d.category]); setPost((prev) => ({ ...prev, categoryId: d.category.id })); setNewCategoryName(""); setShowCategoryInput(false); }
    } catch { alert("Failed to create category"); }
  };

  const createTag = async () => {
    if (!newTagName) return;
    try {
      const res = await fetch("/api/admin/blog/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTagName }) });
      if (res.ok) { const d = await res.json(); setAvailableTags((prev) => [...prev, d.tag]); setPost((prev) => ({ ...prev, tagIds: [...prev.tagIds, d.tag.id] })); setNewTagName(""); setShowTagInput(false); }
    } catch { alert("Failed to create tag"); }
  };

  const toggleTag = (tagId: string) => setPost((prev) => ({ ...prev, tagIds: prev.tagIds.includes(tagId) ? prev.tagIds.filter((id) => id !== tagId) : [...prev.tagIds, tagId] }));

  const readingTime = post.content ? calculateReadingTime(post.content) : 0;
  const wordCount = post.content ? post.content.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = post.content ? post.content.replace(/<[^>]*>/g, "").length : 0;

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  const seoTitleDisplay = post.seoTitle || post.title || "Post Title";
  const metaDescDisplay = post.metaDescription || post.excerpt || "No description set.";
  const ogTitleDisplay = post.ogTitle || seoTitleDisplay;
  const ogDescDisplay = post.ogDescription || metaDescDisplay;
  const ogImageDisplay = post.ogImage || post.coverImage;

  return (
    <div className="min-h-screen -m-6 -mt-6">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin/blog")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 font-display">{post.id ? "Edit Post" : "New Post"}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                {saveStatus === "saving" && <span className="flex items-center gap-1.5 text-xs text-gray-400"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>}
                {saveStatus === "saved" && <span className="flex items-center gap-1.5 text-xs text-emerald-500"><CheckCircle2 className="w-3 h-3" /> Saved</span>}
                {saveStatus === "error" && <span className="flex items-center gap-1.5 text-xs text-red-500"><AlertCircle className="w-3 h-3" /> Failed</span>}
                <span className="text-xs text-gray-400">{wordCount} words · {readingTime} min · {charCount} chars</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getSeoColor(seoResult.score).bg} ${getSeoColor(seoResult.score).text}`}>
                  <Gauge className="w-3 h-3" /> SEO: {seoResult.score}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="text-gray-600"><Eye className="w-4 h-4" /> {showPreview ? "Editor" : "Preview"}</Button>
            <Button variant="ghost" size="sm" onClick={() => handleSave()} disabled={saving} className="text-gray-600"><Save className="w-4 h-4" /> Save Draft</Button>
            <Button onClick={handlePublish} disabled={saving || !post.title || !post.content} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {post.status === "PUBLISHED" ? "Update" : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* ── Main Editor ── */}
        <div className="flex-1 min-w-0 p-6">
          <input type="text" placeholder="Post title..." value={post.title} onChange={(e) => updateTitle(e.target.value)} className="w-full text-3xl md:text-4xl font-bold text-gray-900 font-display placeholder-gray-300 border-none outline-none bg-transparent mb-2" />
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
            <Globe className="w-3.5 h-3.5" /><span>/blog/</span>
            <input type="text" value={post.slug} onChange={(e) => setPost((prev) => ({ ...prev, slug: e.target.value }))} className="border-none outline-none bg-transparent text-gray-600 min-w-50" />
          </div>

          {/* Cover Image — File Upload */}
          <div className="mb-6">
            <ImageUpload
              value={post.coverImage}
              onChange={(url) => setPost((prev) => ({ ...prev, coverImage: url }))}
              context="blog-cover"
              aspectClass="aspect-video"
              hint="Recommended 1200×630 · Auto-converted to WebP"
            />
          </div>

          {showPreview ? (
            <div className="border border-gray-200 rounded-xl bg-white p-8">
              <h1 className="text-3xl font-bold text-gray-900 font-display mb-4">{post.title || "Untitled"}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{readingTime} min read</span>
                <span>{wordCount} words</span>
              </div>
              <article className="prose prose-gray max-w-none prose-headings:font-display prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
          ) : (
            <RichTextEditor content={post.content} onChange={handleContentChange} placeholder="Write your post content here... Use the toolbar above for formatting." />
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="w-96 border-l border-gray-200 bg-gray-50/50 p-5 space-y-5 shrink-0 overflow-y-auto max-h-[calc(100vh-65px)] sticky top-16.25">
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            {(["general", "seo", "social", "advanced"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {tab === "seo" ? "SEO" : tab}
              </button>
            ))}
          </div>

          {/* ═══ GENERAL ═══ */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
                <select value={post.status} onChange={(e) => setPost((prev) => ({ ...prev, status: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700">
                  <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${post.featured ? "bg-blue-600" : "bg-gray-200"}`} onClick={() => setPost((prev) => ({ ...prev, featured: !prev.featured }))}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${post.featured ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <div><span className="text-sm text-gray-700 font-medium">Featured Post</span><p className="text-xs text-gray-400">Highlighted on the blog page</p></div>
              </label>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Category</label>
                {!showCategoryInput ? (
                  <div className="space-y-2">
                    <select value={post.categoryId} onChange={(e) => setPost((prev) => ({ ...prev, categoryId: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700">
                      <option value="">No category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button onClick={() => setShowCategoryInput(true)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"><Plus className="w-3 h-3" /> New Category</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input variant="admin" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category name" className="h-9 text-sm" onKeyDown={(e) => e.key === "Enter" && createCategory()} />
                    <Button size="sm" onClick={createCategory} className="h-9 px-3 shrink-0"><Plus className="w-3 h-3" /></Button>
                    <button onClick={() => setShowCategoryInput(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {availableTags.map((tag) => (
                    <button key={tag.id} onClick={() => toggleTag(tag.id)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${post.tagIds.includes(tag.id) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{tag.name}</button>
                  ))}
                </div>
                {!showTagInput ? (
                  <button onClick={() => setShowTagInput(true)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"><Plus className="w-3 h-3" /> New Tag</button>
                ) : (
                  <div className="flex gap-2">
                    <Input variant="admin" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Tag name" className="h-9 text-sm" onKeyDown={(e) => e.key === "Enter" && createTag()} />
                    <Button size="sm" onClick={createTag} className="h-9 px-3 shrink-0"><Plus className="w-3 h-3" /></Button>
                    <button onClick={() => setShowTagInput(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Excerpt</label>
                  <button onClick={generateSmartExcerpt} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"><Wand2 className="w-3 h-3" /> Generate</button>
                </div>
                <Textarea variant="admin" rows={3} value={post.excerpt} onChange={(e) => setPost((prev) => ({ ...prev, excerpt: e.target.value }))} placeholder="Brief summary..." className="text-sm" />
                <p className={`text-xs mt-1 ${post.excerpt.length > 160 ? "text-amber-500" : "text-gray-400"}`}>{post.excerpt.length}/160 characters</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Schedule Publish</label>
                <Input variant="admin" type="datetime-local" value={post.scheduledAt} onChange={(e) => setPost((prev) => ({ ...prev, scheduledAt: e.target.value }))} className="text-sm" />
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Content Stats</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Words", value: wordCount, icon: Type },
                    { label: "Characters", value: charCount.toLocaleString(), icon: Hash },
                    { label: "Reading Time", value: `${readingTime} min`, icon: Clock },
                    { label: "Images", value: (post.content.match(/<img[\s]/gi) || []).length + (post.coverImage ? 1 : 0), icon: ImageLucide },
                    { label: "Headings", value: (post.content.match(/<h[1-6][\s>]/gi) || []).length, icon: Heading },
                    { label: "Links", value: (post.content.match(/<a[\s]/gi) || []).length, icon: Link2 },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2 py-1.5">
                      <s.icon className="w-3.5 h-3.5 text-gray-400" />
                      <div><p className="text-xs text-gray-400">{s.label}</p><p className="text-sm font-medium text-gray-900">{s.value}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ SEO ═══ */}
          {activeTab === "seo" && (
            <div className="space-y-5">
              {/* Score card */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center gap-4 mb-3">
                  <ScoreCircle score={seoResult.score} size={64} />
                  <div>
                    <p className={`text-lg font-bold ${getSeoColor(seoResult.score).text}`}>{getSeoLabel(seoResult.score)}</p>
                    <p className="text-xs text-gray-400">{seoResult.checks.filter((c) => c.status === "pass").length}/{seoResult.checks.length} checks passed</p>
                  </div>
                </div>
                <button onClick={() => setSeoExpanded(!seoExpanded)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 w-full">
                  <ListChecks className="w-3 h-3" /> {seoExpanded ? "Hide" : "Show"} Checklist
                  {seoExpanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                </button>
                {seoExpanded && (
                  <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
                    {seoResult.checks.map((check) => (
                      <div key={check.id} className="flex items-start gap-2 py-1">
                        <CheckIcon status={check.status} />
                        <div className="min-w-0"><p className="text-xs font-medium text-gray-700">{check.label}</p><p className="text-xs text-gray-400">{check.message}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Focus Keyword */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider"><Target className="w-3 h-3 inline mr-1" />Focus Keyword</label>
                <Input variant="admin" value={post.focusKeyword} onChange={(e) => setPost((prev) => ({ ...prev, focusKeyword: e.target.value }))} placeholder="e.g. integrity leadership" className="text-sm" />
                <p className="text-xs text-gray-400 mt-1">Primary keyword to rank for.</p>
              </div>

              {/* SEO Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">SEO Title</label>
                  <button onClick={generateSeoTitle} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"><Wand2 className="w-3 h-3" /> Generate</button>
                </div>
                <Input variant="admin" value={post.seoTitle} onChange={(e) => setPost((prev) => ({ ...prev, seoTitle: e.target.value }))} placeholder={post.title || "Custom title for search engines"} className="text-sm" />
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs ${(post.seoTitle || post.title).length > 60 ? "text-red-500" : (post.seoTitle || post.title).length >= 30 ? "text-emerald-500" : "text-amber-500"}`}>{(post.seoTitle || post.title).length}/60</p>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${(post.seoTitle || post.title).length > 60 ? "bg-red-500" : (post.seoTitle || post.title).length >= 30 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.min(100, ((post.seoTitle || post.title).length / 60) * 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Meta Description</label>
                  <button onClick={generateMetaDescription} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"><Wand2 className="w-3 h-3" /> Generate</button>
                </div>
                <Textarea variant="admin" rows={3} value={post.metaDescription} onChange={(e) => setPost((prev) => ({ ...prev, metaDescription: e.target.value }))} placeholder="SEO description..." className="text-sm" />
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs ${post.metaDescription.length > 155 ? "text-red-500" : post.metaDescription.length >= 120 ? "text-emerald-500" : post.metaDescription.length > 0 ? "text-amber-500" : "text-gray-400"}`}>{post.metaDescription.length}/155</p>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${post.metaDescription.length > 155 ? "bg-red-500" : post.metaDescription.length >= 120 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.min(100, (post.metaDescription.length / 155) * 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* Canonical URL */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider"><Link2 className="w-3 h-3 inline mr-1" />Canonical URL</label>
                <Input variant="admin" value={post.canonicalUrl} onChange={(e) => setPost((prev) => ({ ...prev, canonicalUrl: e.target.value }))} placeholder="https://..." className="text-sm" />
                <p className="text-xs text-gray-400 mt-1">Set if content is syndicated.</p>
              </div>

              {/* SERP Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider"><SearchIcon className="w-3 h-3 inline mr-1" />Search Preview</label>
                  <div className="flex bg-gray-100 rounded-md p-0.5">
                    <button onClick={() => setSerpPreview("desktop")} className={`p-1 rounded ${serpPreview === "desktop" ? "bg-white shadow-sm" : ""}`}><Monitor className="w-3 h-3 text-gray-500" /></button>
                    <button onClick={() => setSerpPreview("mobile")} className={`p-1 rounded ${serpPreview === "mobile" ? "bg-white shadow-sm" : ""}`}><Smartphone className="w-3 h-3 text-gray-500" /></button>
                  </div>
                </div>
                <div className={`p-3 bg-white rounded-lg border border-gray-200 ${serpPreview === "mobile" ? "max-w-72" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center"><Globe className="w-3.5 h-3.5 text-blue-600" /></div>
                    <div>
                      <p className="text-xs text-gray-800">Integrity Man Network</p>
                      <p className="text-xs text-gray-500 truncate">integrityman.network › blog › {post.slug || "post-slug"}</p>
                    </div>
                  </div>
                  <p className="text-blue-700 text-sm font-medium leading-tight mb-0.5">{seoTitleDisplay.slice(0, 60)} | TIMN Blog</p>
                  <p className="text-gray-600 text-xs leading-relaxed">{metaDescDisplay.slice(0, serpPreview === "mobile" ? 120 : 155)}{metaDescDisplay.length > (serpPreview === "mobile" ? 120 : 155) ? "..." : ""}</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ SOCIAL ═══ */}
          {activeTab === "social" && (
            <div className="space-y-5">
              {/* OG Image */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider"><Facebook className="w-3 h-3 inline mr-1" />Open Graph Image</label>
                  <ImageUpload
                    value={post.ogImage}
                    onChange={(url) => setPost((prev) => ({ ...prev, ogImage: url }))}
                    context="blog-og"
                    aspectClass="aspect-video"
                    hint="1200×630 · Falls back to cover image"
                  />
                <p className="text-xs text-gray-400 mt-1">Falls back to cover image. 1200×630px recommended.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">OG Title</label>
                <Input variant="admin" value={post.ogTitle} onChange={(e) => setPost((prev) => ({ ...prev, ogTitle: e.target.value }))} placeholder={seoTitleDisplay} className="text-sm" />
                <p className="text-xs text-gray-400 mt-1">{(post.ogTitle || seoTitleDisplay).length}/70</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">OG Description</label>
                <Textarea variant="admin" rows={2} value={post.ogDescription} onChange={(e) => setPost((prev) => ({ ...prev, ogDescription: e.target.value }))} placeholder={metaDescDisplay} className="text-sm" />
                <p className="text-xs text-gray-400 mt-1">{(post.ogDescription || metaDescDisplay).length}/200</p>
              </div>

              {/* Facebook Preview */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider"><Facebook className="w-3 h-3 inline mr-1" />Facebook Preview</label>
                <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {ogImageDisplay ? <img src={ogImageDisplay} alt="" className="w-full h-full object-cover" /> : <ImageLucide className="w-8 h-8 text-gray-300" />}
                  </div>
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500 uppercase">integrityman.network</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-1">{ogTitleDisplay}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ogDescDisplay}</p>
                  </div>
                </div>
              </div>

              {/* Twitter Image */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider"><Twitter className="w-3 h-3 inline mr-1" />Twitter Card Image</label>
                <ImageUpload
                  value={post.twitterImage}
                  onChange={(url) => setPost((prev) => ({ ...prev, twitterImage: url }))}
                  context="blog-og"
                  aspectClass="aspect-video"
                  hint="1200×675 · Falls back to OG then cover image"
                />
                <p className="text-xs text-gray-400 mt-1">Falls back to OG, then cover image.</p>
              </div>

              {/* Twitter Preview */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider"><Twitter className="w-3 h-3 inline mr-1" />Twitter/X Preview</label>
                <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {(post.twitterImage || ogImageDisplay) ? <img src={post.twitterImage || ogImageDisplay!} alt="" className="w-full h-full object-cover" /> : <ImageLucide className="w-8 h-8 text-gray-300" />}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{ogTitleDisplay}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ogDescDisplay}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Link2 className="w-3 h-3" /> integrityman.network</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ ADVANCED ═══ */}
          {activeTab === "advanced" && (
            <div className="space-y-5">
              <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Shield className="w-3 h-3" /> Robots Directives</h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${post.noIndex ? "bg-red-500" : "bg-gray-200"}`} onClick={() => setPost((prev) => ({ ...prev, noIndex: !prev.noIndex }))}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${post.noIndex ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <div><span className="text-sm text-gray-700 font-medium">No Index</span><p className="text-xs text-gray-400">Prevent indexing</p></div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${post.noFollow ? "bg-red-500" : "bg-gray-200"}`} onClick={() => setPost((prev) => ({ ...prev, noFollow: !prev.noFollow }))}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${post.noFollow ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <div><span className="text-sm text-gray-700 font-medium">No Follow</span><p className="text-xs text-gray-400">Prevent link following</p></div>
                </label>
                {(post.noIndex || post.noFollow) && (
                  <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">This post will {post.noIndex ? "not be indexed" : ""}{post.noIndex && post.noFollow ? " and " : ""}{post.noFollow ? "links won't be followed" : ""} by search engines.</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Publishing Info</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${post.status === "DRAFT" ? "bg-yellow-400" : post.status === "PUBLISHED" ? "bg-emerald-400" : "bg-gray-400"}`} />
                    <span className="text-sm text-gray-700">Status: <span className="font-medium">{post.status}</span></span>
                  </div>
                  {post.scheduledAt && <div className="flex items-center gap-3"><Calendar className="w-3.5 h-3.5 text-blue-600" /><span className="text-sm text-gray-700">Scheduled: {new Date(post.scheduledAt).toLocaleString()}</span></div>}
                  {post.featured && <div className="flex items-center gap-3"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /><span className="text-sm text-gray-700">Featured post</span></div>}
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Keyboard Shortcuts</h4>
                <div className="space-y-2 text-xs">
                  {[{ keys: "Ctrl+B", action: "Bold" }, { keys: "Ctrl+I", action: "Italic" }, { keys: "Ctrl+U", action: "Underline" }, { keys: "Ctrl+Z", action: "Undo" }, { keys: "Ctrl+Shift+Z", action: "Redo" }].map((s) => (
                    <div key={s.keys} className="flex items-center justify-between"><span className="text-gray-500">{s.action}</span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-xs">{s.keys}</kbd></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
