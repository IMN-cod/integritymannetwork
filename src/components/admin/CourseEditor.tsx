"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  GraduationCap,
  Upload,
  X,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourseFormData {
  title: string;
  slug: string;
  description: string;
  summary: string;
  coverImage: string;
  instructor: string;
  duration: string;
  level: string;
  category: string;
  price: string;
  isFree: boolean;
  featured: boolean;
  status: string;
  maxStudents: string;
  startDate: string;
  endDate: string;
  syllabus: string;
  prerequisites: string;
  learningOutcomes: string;
  sortOrder: string;
}

const defaultForm: CourseFormData = {
  title: "",
  slug: "",
  description: "",
  summary: "",
  coverImage: "",
  instructor: "",
  duration: "",
  level: "BEGINNER",
  category: "",
  price: "0",
  isFree: true,
  featured: false,
  status: "DRAFT",
  maxStudents: "",
  startDate: "",
  endDate: "",
  syllabus: "",
  prerequisites: "",
  learningOutcomes: "",
  sortOrder: "0",
};

const CATEGORIES = [
  "Character Formation",
  "Leadership",
  "Doctrine & Theology",
  "Purpose & Identity",
  "Family & Fatherhood",
  "Work & Integrity",
  "Evangelism & Outreach",
];

export default function CourseEditor({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CourseFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!courseId);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const isEdit = !!courseId;

  useEffect(() => {
    if (courseId) {
      fetch(`/api/admin/courses/${courseId}`)
        .then((r) => r.json())
        .then(({ course }) => {
          if (course) {
            setForm({
              title: course.title || "",
              slug: course.slug || "",
              description: course.description || "",
              summary: course.summary || "",
              coverImage: course.coverImage || "",
              instructor: course.instructor || "",
              duration: course.duration || "",
              level: course.level || "BEGINNER",
              category: course.category || "",
              price: String(course.price || 0),
              isFree: course.isFree ?? true,
              featured: course.featured || false,
              status: course.status || "DRAFT",
              maxStudents: course.maxStudents ? String(course.maxStudents) : "",
              startDate: course.startDate ? new Date(course.startDate).toISOString().slice(0, 16) : "",
              endDate: course.endDate ? new Date(course.endDate).toISOString().slice(0, 16) : "",
              syllabus: course.syllabus || "",
              prerequisites: course.prerequisites || "",
              learningOutcomes: course.learningOutcomes || "",
              sortOrder: String(course.sortOrder || 0),
            });
          }
        })
        .catch(() => setError("Failed to load course"))
        .finally(() => setLoading(false));
    }
  }, [courseId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      if (data.urls?.[0]) {
        setForm((prev) => ({ ...prev, coverImage: data.urls[0] }));
      }
    } catch {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.description) {
      setError("Title and description are required");
      return;
    }

    setSaving(true);
    try {
      const method = isEdit ? "PATCH" : "POST";
      const url = isEdit ? `/api/admin/courses/${courseId}` : "/api/admin/courses";

      const body = {
        ...form,
        price: parseFloat(form.price) || 0,
        maxStudents: form.maxStudents ? parseInt(form.maxStudents) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        sortOrder: parseInt(form.sortOrder) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/admin/courses");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof CourseFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">
              {isEdit ? "Edit Course" : "New Course"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEdit ? "Update course details" : "Create a new course for the School of Integrity"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && (
            <a href="/school" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><Eye className="w-3.5 h-3.5" /> Preview</Button>
            </a>
          )}
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Course"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card variant="admin">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Title *</label>
                <Input variant="admin" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Course title" required />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">URL Slug</label>
                <Input variant="admin" value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="auto-generated-from-title" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Summary</label>
                <Textarea variant="admin" value={form.summary} onChange={(e) => update("summary", e.target.value)} placeholder="Brief summary for cards and previews" rows={2} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Description *</label>
                <Textarea variant="admin" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Full course description..." rows={6} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cover Image */}
        <Card variant="admin">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Cover Image</h2>
          </CardHeader>
          <CardContent>
            {form.coverImage ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img src={form.coverImage} alt="Cover" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => update("coverImage", "")}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-400 bg-gray-50 cursor-pointer transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload cover image</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                  </>
                )}
              </label>
            )}
          </CardContent>
        </Card>

        {/* Course Details */}
        <Card variant="admin">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Course Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Instructor</label>
                <Input variant="admin" value={form.instructor} onChange={(e) => update("instructor", e.target.value)} placeholder="Instructor name" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Duration</label>
                <Input variant="admin" value={form.duration} onChange={(e) => update("duration", e.target.value)} placeholder="e.g. 6 weeks, 3 months" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => update("level", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Max Students</label>
                <Input variant="admin" type="number" value={form.maxStudents} onChange={(e) => update("maxStudents", e.target.value)} placeholder="Unlimited" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Sort Order</label>
                <Input variant="admin" type="number" value={form.sortOrder} onChange={(e) => update("sortOrder", e.target.value)} placeholder="0" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates & Pricing */}
        <Card variant="admin">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Schedule & Pricing</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Start Date</label>
                <Input variant="admin" type="datetime-local" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">End Date</label>
                <Input variant="admin" type="datetime-local" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFree}
                  onChange={(e) => update("isFree", e.target.checked)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Free course</span>
              </label>
            </div>
            {!form.isFree && (
              <div className="max-w-xs">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Price (GHS)</label>
                <Input variant="admin" type="number" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0.00" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Curriculum */}
        <Card variant="admin">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Curriculum</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Learning Outcomes</label>
              <Textarea variant="admin" value={form.learningOutcomes} onChange={(e) => update("learningOutcomes", e.target.value)} placeholder="What students will learn (one per line)..." rows={4} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Prerequisites</label>
              <Textarea variant="admin" value={form.prerequisites} onChange={(e) => update("prerequisites", e.target.value)} placeholder="Any prerequisites for this course..." rows={3} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Syllabus</label>
              <Textarea variant="admin" value={form.syllabus} onChange={(e) => update("syllabus", e.target.value)} placeholder="Course syllabus or module outline..." rows={6} />
            </div>
          </CardContent>
        </Card>

        {/* Publishing */}
        <Card variant="admin">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Publishing</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => update("featured", e.target.checked)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Featured course</span>
            </label>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href="/admin/courses">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : isEdit ? "Update Course" : "Create Course"}
          </Button>
        </div>
      </form>
    </div>
  );
}
