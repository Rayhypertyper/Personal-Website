import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ProjectDemoLoopProps {
  title: string;
  src: string;
  poster: string;
  width: number;
  height: number;
  lazy?: boolean;
  suspended: boolean;
}

export function ProjectDemoLoop({ title, src, poster, width, height, lazy, suspended }: ProjectDemoLoopProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackPreference = useRef<boolean | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || suspended) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;

    const syncPlayback = () => {
      const shouldPlay = playbackPreference.current ?? !motion.matches;
      if (shouldPlay && inView && !document.hidden) {
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    });
    observer.observe(video);
    motion.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      observer.disconnect();
      motion.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, [suspended]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    playbackPreference.current = video.paused;
    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  return (
    <div className="projects-feature__media">
      <video
        ref={videoRef}
        className="projects-feature__video"
        src={src}
        poster={poster}
        width={width}
        height={height}
        {...(lazy ? { loading: "lazy" } : {})}
        preload="none"
        loop
        muted
        playsInline
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!suspended && (
        <button
          type="button"
          className="projects-feature__preview-toggle"
          aria-label={`${playing ? "Pause" : "Play"} ${title} preview`}
          onClick={togglePlayback}
        >
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
