"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const WAVE_WIDTH = 1200;
const WAVE_HEIGHT = 61;
const FREQUENCY = 0.04;
const AMPLITUDE = 30;

export default function ClockCycleWave({ clock_cycles, className = "" }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const points = Array.from({ length: WAVE_WIDTH }, (_, x) => {
    const sine = Math.sin((x + phase * 30) * FREQUENCY);
    const y = WAVE_HEIGHT / 2 + (sine >= 0 ? AMPLITUDE : -AMPLITUDE);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      <svg width={WAVE_WIDTH} height={WAVE_HEIGHT}>
        <polyline
          fill="none"
          stroke="#df7e08"
          strokeWidth="2"
          points={points}
        />
      </svg>

      <motion.div
        className="text-2xl font-mono text-[#df7e08] mt-4"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        Clock Cycles: {clock_cycles}
      </motion.div>
    </div>
  );
}
