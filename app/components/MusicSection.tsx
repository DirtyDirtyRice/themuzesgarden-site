
"use client";

import React, { useEffect, useRef } from "react";

type Track = {
  title: string;
  src: string;
};

type Props = {
  id: string;
  title: string;
  tracks: Track[];
};

export default function MusicSection({ id, title, tracks }: Props) {
  const audioRefs = useRef<HTMLAudioElement[]>([]);

  // Cleanup: stop & unload audio when section unmounts
  useEffect(() => {
    return () => {
      audioRefs.current.forEach((a) => {
        try {
          a.pause();
          a.src = "";
        } catch {}
      });
      audioRefs.current = [];
    };
  }, []);

  return (
    <section
      id={id}
      className="mb-16 rounded-xl border bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 text-2xl font-semibold">{title}</h2>

      <div className="space-y-4">
        {tracks.map((t, i) => (
          <div key={i} className="rounded-lg border p-3">
            <div className="mb-2 font-medium">{t.title}</div>
            <audio
              controls
              preload="none"
              ref={(el) => {
                if (el) audioRefs.current[i] = el;
              }}
            >
              <source src={t.src} type="audio/mpeg" />
            </audio>
          </div>
        ))}
      </div>
    </section>
  );
}