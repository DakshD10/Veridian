"use client";

import { useEffect, useState, useRef } from "react";

export function CursorGlowTrail() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetPosition.current = { x: e.clientX, y: e.clientY };
    };

    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const animate = () => {
      setPosition((prev) => ({
        x: lerp(prev.x, targetPosition.current.x, 0.12),
        y: lerp(prev.y, targetPosition.current.y, 0.12),
      }));
      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <div
      className="fixed w-[400px] h-[400px] pointer-events-none z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        background:
          "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)",
      }}
    />
  );
}
