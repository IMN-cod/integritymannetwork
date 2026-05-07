"use client";

import { useRef, useEffect, useState } from "react";
import NextImage from "next/image";

// ═══════════════════════════════════════════════════════
// ANTI-DOWNLOAD PROPS — applied to all media
// Prevents: right-click save, drag-save, PiP, download button
// ═══════════════════════════════════════════════════════

const PROTECTED_VIDEO_ATTRS = {
  controlsList: "nodownload nofullscreen noremoteplayback" as string,
  disablePictureInPicture: true,
  disableRemotePlayback: true,
  controls: false as const,
  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
};

const PROTECTED_WRAPPER = {
  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  onDragStart: (e: React.DragEvent) => e.preventDefault(),
};

// ═══════════════════════════════════════════════════════
// INTERSECTION OBSERVER — auto-play when visible + lazy load
// Uses rootMargin to start loading slightly before visible
// ═══════════════════════════════════════════════════════

function useAutoPlayOnView(videoRef: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.15, rootMargin: "200px" }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [videoRef]);
}

// ═══════════════════════════════════════════════════════
// LAZY VIDEO SOURCE — only loads video src when near viewport
// Saves bandwidth for off-screen videos
// ═══════════════════════════════════════════════════════

// Derive a poster path from a video src if none was passed.
// Convention: /videos/foo.mp4 → /videos/posters/foo.webp
function derivePoster(src: string, explicit?: string): string | undefined {
  if (explicit) return explicit;
  const m = src.match(/^(.*\/)?([^/]+)\.(mp4|webm|mov)$/i);
  if (!m) return undefined;
  const dir = m[1] || "";
  return `${dir}posters/${m[2]}.webp`;
}

function useLazyVideoSrc(src: string) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadedSrc(src);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" } // Start loading 400px before visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  return { loadedSrc, sentinelRef };
}

// ═══════════════════════════════════════════════════════
// BACKGROUND VIDEO — hero sections
// Always playing, muted, looped, fully protected, no controls
// ═══════════════════════════════════════════════════════

export function BackgroundVideo({
  src,
  poster,
  overlay = true,
  className = "",
}: {
  src: string;
  poster?: string;
  overlay?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useAutoPlayOnView(videoRef);
  const resolvedPoster = derivePoster(src, poster);

  return (
    <div
      className={`absolute inset-0 overflow-hidden select-none ${className}`}
      {...PROTECTED_WRAPPER}
    >
      {resolvedPoster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedPoster}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}
      <video
        ref={videoRef}
        poster={resolvedPoster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        {...PROTECTED_VIDEO_ATTRS}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Transparent overlay blocks all direct video interaction */}
      <div className="absolute inset-0 z-1" />

      {overlay && (
        <>
          <div className="absolute inset-0 bg-zinc-950/70 z-2" />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/50 to-transparent z-2" />
          <div className="absolute inset-0 bg-grid opacity-20 z-2" />
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// INLINE VIDEO PLAYER — used for content sections
// Always playing, muted, looped — NO controls, NO pause/play,
// NO fullscreen, NO progress bar. Pure decorative autoplay.
// ═══════════════════════════════════════════════════════

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  /** Aspect ratio class — defaults to "aspect-video" */
  aspect?: string;
  /** Optional title shown at bottom */
  title?: string;
  /** Rounded corners */
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full" | "none";
}

export function VideoPlayer({
  src,
  poster,
  className = "",
  aspect = "aspect-video",
  title,
  rounded = "2xl",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { loadedSrc, sentinelRef } = useLazyVideoSrc(src);
  const resolvedPoster = derivePoster(src, poster);

  // Auto-play on scroll into view
  useAutoPlayOnView(videoRef);

  const roundedClass = rounded === "none" ? "" : `rounded-${rounded}`;

  return (
    <div
      ref={sentinelRef}
      className={`${aspect} relative overflow-hidden ${roundedClass} bg-zinc-900 border border-zinc-800/50 select-none ${className}`}
      {...PROTECTED_WRAPPER}
    >
      {/* Poster — always rendered as background so users see media even before video loads */}
      {resolvedPoster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedPoster}
          alt={title || ""}
          aria-hidden={!title}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}
      {/* Video — lazy loaded, no controls, pointer-events disabled */}
      {loadedSrc && (
        <video
          ref={videoRef}
          poster={resolvedPoster}
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
          {...PROTECTED_VIDEO_ATTRS}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src={loadedSrc} type="video/mp4" />
        </video>
      )}

      {/* Full-cover overlay — blocks ALL direct video interaction / download */}
      <div className="absolute inset-0 z-1" />

      {/* Title overlay at bottom */}
      {title && (
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-linear-to-t from-zinc-950/80 via-zinc-950/40 to-transparent z-2 pointer-events-none">
          <p className="text-white font-semibold text-base drop-shadow-lg">{title}</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VIDEO CARD — for galleries / grids
// Always playing, fully protected, no controls
// ═══════════════════════════════════════════════════════

export function VideoCard({
  src,
  poster,
  title,
  description,
  className = "",
}: {
  src: string;
  poster?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`group ${className}`}>
      <VideoPlayer
        src={src}
        poster={poster}
        title={title}
        rounded="xl"
        className="mb-4"
      />
      <h3 className="text-lg font-bold text-white font-display mb-1 group-hover:text-orange-500 transition-colors">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PROTECTED IMAGE — blocks download, drag, right-click
// Drop-in replacement for next/image's <Image> with protection overlay.
// The parent element MUST have position:relative (and dimensions) for fill mode.
// ═══════════════════════════════════════════════════════

export function ProtectedImage({
  src,
  alt,
  className = "",
  fill = false,
  priority = false,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <>
      <NextImage
        src={src}
        alt={alt}
        fill={fill}
        priority={priority}
        draggable={false}
        sizes={sizes || (fill ? "(max-width: 768px) 100vw, 50vw" : undefined)}
        onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
        className={className}
      />
      {/* Transparent overlay sits on top of the image — blocks right-click / save-as */}
      <div
        className="absolute inset-0 z-1"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </>
  );
}
