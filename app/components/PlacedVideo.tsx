"use client";

import type { VideoPlacement } from "@/app/lib/videoPlacements";
import { useEffect, useRef, useState } from "react";

export default function PlacedVideo({ placement, className = "" }: { placement: VideoPlacement; className?: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      const timeout = window.setTimeout(() => setFallback(true), 0);
      return () => window.clearTimeout(timeout);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setLoad(true); observer.disconnect(); }
    }, { rootMargin: "250px" });
    if (wrapper.current) observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (load && placement.autoplay) video.current?.play().catch(() => undefined);
  }, [load, placement.autoplay]);

  const muted = placement.placement === "homepage-hero" && placement.autoplay ? true : placement.muted;
  return (
    <div ref={wrapper} className={`placed-video ${className}`}>
      {fallback ? (
        placement.mobileFallbackUrl ? <img src={placement.mobileFallbackUrl} alt="" className="placed-video-media" /> : null
      ) : (
        <video ref={video} className="placed-video-media" src={load ? placement.videoUrl : undefined}
          poster={placement.mobileFallbackUrl || undefined} autoPlay={placement.autoplay} muted={muted}
          loop={placement.loop} playsInline controls={!placement.autoplay} preload="none" onError={() => setFallback(true)} />
      )}
      {(placement.headline || placement.supportingText || placement.buttonLabel) ? (
        <div className="placed-video-copy">
          {placement.headline ? <h2>{placement.headline}</h2> : null}
          {placement.supportingText ? <p>{placement.supportingText}</p> : null}
          {placement.buttonLabel && placement.buttonLink ? <a href={placement.buttonLink}>{placement.buttonLabel}</a> : null}
        </div>
      ) : null}
    </div>
  );
}
