/**
 * Central Image Upload Component — Integrity Man Network
 *
 * Two exports:
 *   <ImageUpload />       — single image (cover photos, OG images, avatars)
 *   <MultiImageUpload />  — multi-image grid (product galleries)
 *
 * Both upload to /api/admin/upload?context=<ctx> and display:
 *   • Drag-and-drop zone or click-to-browse
 *   • Live preview with Replace / Remove overlay
 *   • Optimisation stats badge (original → output size, % saved)
 *   • Inline error display
 */

"use client";

import { useRef, useState, useCallback } from "react";
import {
  Upload,
  X,
  RefreshCw,
  Loader2,
  ImageIcon,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageContext } from "@/lib/image-optimizer";

// ── Helpers ───────────────────────────────────────────────────────────

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

interface UploadStats {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

// ══════════════════════════════════════════════════════════════════════
//  Single Image Upload
// ══════════════════════════════════════════════════════════════════════

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  context?: ImageContext;
  label?: string;
  hint?: string;
  /** Tailwind aspect-ratio class applied to the drop zone and preview */
  aspectClass?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  context = "general",
  label,
  hint,
  aspectClass = "aspect-video",
  className,
  disabled,
}: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const doUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      setStats(null);
      try {
        const fd = new FormData();
        fd.append("files", file);
        const res = await fetch(`/api/admin/upload?context=${context}`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        if (data.errors?.length && !data.results?.length)
          throw new Error(data.errors[0]);
        const r = data.results?.[0];
        if (r?.url) {
          onChange(r.url);
          setStats({
            originalSize: r.originalSize,
            optimizedSize: r.optimizedSize,
            compressionRatio: r.compressionRatio,
            width: r.width,
            height: r.height,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [context, onChange]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) doUpload(e.target.files[0]);
    },
    [doUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) doUpload(e.dataTransfer.files[0]);
    },
    [doUpload]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  const onDragLeave = () => setDragActive(false);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || uploading}
      />

      {value ? (
        /* ── Preview ── */
        <div
          className={cn(
            "relative rounded-xl overflow-hidden group border border-gray-200 bg-gray-50",
            aspectClass
          )}
        >
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || disabled}
              className="px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-gray-900 hover:bg-gray-100 flex items-center gap-1.5 shadow-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={() => { onChange(""); setStats(null); }}
              disabled={uploading || disabled}
              className="px-3 py-1.5 bg-red-500 rounded-lg text-xs font-semibold text-white hover:bg-red-600 flex items-center gap-1.5 shadow-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>

          {/* Upload spinner overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-medium text-blue-600">Optimizing…</p>
            </div>
          )}
        </div>
      ) : (
        /* ── Drop zone ── */
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          disabled={disabled || uploading}
          className={cn(
            "w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer",
            aspectClass,
            dragActive
              ? "border-blue-400 bg-blue-50/60"
              : "border-gray-200 hover:border-blue-400/70 hover:bg-blue-50/25",
            (disabled || uploading) && "opacity-50 pointer-events-none"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-9 h-9 text-blue-500 animate-spin" />
              <p className="text-sm font-medium text-blue-600">Uploading & optimizing…</p>
            </>
          ) : (
            <>
              <div
                className={cn(
                  "p-3 rounded-xl transition-colors",
                  dragActive ? "bg-blue-100" : "bg-gray-100"
                )}
              >
                <Upload
                  className={cn(
                    "w-6 h-6 transition-colors",
                    dragActive ? "text-blue-500" : "text-gray-400"
                  )}
                />
              </div>
              <div className="text-center px-4">
                <p className="text-sm font-semibold text-gray-700">
                  {dragActive ? "Drop to upload" : "Click or drag image here"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {hint ?? "JPEG, PNG, WebP, GIF, AVIF · Max 20 MB"}
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <span className="shrink-0">⚠</span>
          {error}
        </p>
      )}

      {/* Optimisation stats */}
      {stats && (
        <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
          <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold">Optimized</span>
            <span className="text-emerald-400">·</span>
            <span>{fmtBytes(stats.originalSize)}</span>
            <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="font-bold">{fmtBytes(stats.optimizedSize)}</span>
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
              {stats.compressionRatio}% smaller
            </span>
            <span className="text-emerald-400">·</span>
            <span className="text-emerald-500">{stats.width}×{stats.height}px</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  Multi-Image Upload  (product galleries)
// ══════════════════════════════════════════════════════════════════════

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  context?: ImageContext;
  label?: string;
  hint?: string;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

export function MultiImageUpload({
  value = [],
  onChange,
  context = "product",
  label = "Images",
  hint,
  maxFiles = 8,
  className,
  disabled,
}: MultiImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const doUpload = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      const remaining = maxFiles - value.length;
      if (remaining <= 0) return;
      const batch = arr.slice(0, remaining);

      setUploading(true);
      setError(null);
      try {
        const fd = new FormData();
        batch.forEach((f) => fd.append("files", f));
        const res = await fetch(`/api/admin/upload?context=${context}`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        if (data.errors?.length && !data.results?.length)
          throw new Error(data.errors[0]);
        const newUrls: string[] = (data.results ?? []).map(
          (r: { url: string }) => r.url
        );
        onChange([...value, ...newUrls]);
        if (data.errors?.length) setError(data.errors.join("; "));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [context, onChange, value, maxFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) doUpload(e.target.files);
    },
    [doUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.length) doUpload(e.dataTransfer.files);
    },
    [doUpload]
  );

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  const swap = (a: number, b: number) => {
    if (b < 0 || b >= value.length) return;
    const arr = [...value];
    [arr[a], arr[b]] = [arr[b], arr[a]];
    onChange(arr);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </label>
          <span className="text-xs text-gray-400">
            {value.length}/{maxFiles}
          </span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || uploading}
      />

      {/* Image grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
            >
              <img
                src={url}
                alt={`Image ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-blue-600/90 rounded text-white text-[9px] font-bold uppercase tracking-wide">
                  Main
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => swap(i, i - 1)}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-xs font-bold text-gray-700"
                    title="Move left"
                  >
                    ←
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-1.5 bg-red-500 rounded-lg hover:bg-red-600"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                {i < value.length - 1 && (
                  <button
                    type="button"
                    onClick={() => swap(i, i + 1)}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-xs font-bold text-gray-700"
                    title="Move right"
                  >
                    →
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add-more tile */}
          {value.length < maxFiles && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              disabled={uploading || disabled}
              className={cn(
                "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all",
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-blue-400/60 hover:bg-blue-50/30",
                (uploading || disabled) && "opacity-50 pointer-events-none"
              )}
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] font-medium text-gray-400">Add</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Empty state drop zone */}
      {value.length === 0 && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          disabled={uploading || disabled}
          className={cn(
            "w-full border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-all cursor-pointer",
            dragActive
              ? "border-blue-400 bg-blue-50/60"
              : "border-gray-200 hover:border-blue-400/70 hover:bg-blue-50/25",
            (disabled || uploading) && "opacity-50 pointer-events-none"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-9 h-9 text-blue-500 animate-spin" />
              <p className="text-sm font-medium text-blue-600">
                Uploading & optimizing…
              </p>
            </>
          ) : (
            <>
              <div className={cn("p-3 rounded-xl", dragActive ? "bg-blue-100" : "bg-gray-100")}>
                <ImageIcon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    dragActive ? "text-blue-500" : "text-gray-400"
                  )}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {dragActive ? "Drop images here" : "Click or drag images here"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {hint ?? `Up to ${maxFiles} images · JPEG, PNG, WebP, AVIF · Max 20 MB each`}
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
