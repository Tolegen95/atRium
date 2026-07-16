import { useEffect, useRef } from "react";
import { MASCOT_IMAGES, MASCOT_LABELS, MASCOT_PARTICLES, MASCOT_PHRASES, type MascotMood } from "../mascot/mood";

export default function Mascot({ mood }: { mood: MascotMood }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const pool = MASCOT_PARTICLES[mood];

    const spawn = () => {
      const el = document.createElement("span");
      el.className = "mascot-particle";
      el.textContent = pool[Math.floor(Math.random() * pool.length)];
      el.style.left = 20 + Math.random() * 60 + "%";
      el.style.setProperty("--dx", Math.round(Math.random() * 40 - 20) + "px");
      container.appendChild(el);
      setTimeout(() => el.remove(), 2200);
    };

    spawn();
    const interval = setInterval(spawn, 900);
    return () => clearInterval(interval);
  }, [mood]);

  return (
    <div className={`mascot-widget mood-${mood}`} ref={containerRef}>
      <span className="mascot-mood-tag">{MASCOT_LABELS[mood]}</span>
      <div className="mascot-face">
        <img src={MASCOT_IMAGES[mood]} alt={MASCOT_LABELS[mood]} />
      </div>
      <p className="mascot-phrase">{MASCOT_PHRASES[mood]}</p>
    </div>
  );
}
