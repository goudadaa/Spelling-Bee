import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

const COLORS = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF9F29", "#E15FED", "#5CE1E6"];

export default function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const list: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      list.push({
        id: i,
        // Radial dispersion
        x: (Math.random() - 0.5) * 600,
        y: -150 - Math.random() * 350,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 14 + 8,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.2,
      });
    }
    setParticles(list);
  }, []);

  return (
    <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 bottom-1/3 rounded-sm"
          style={{
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.5 }}
          animate={{
            x: p.x,
            y: p.y,
            rotate: p.rotation + 1080,
            opacity: [1, 1, 0],
            scale: [0.5, 1.2, 0.4],
          }}
          transition={{
            duration: 1.8,
            ease: "easeOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
