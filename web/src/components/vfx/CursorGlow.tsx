"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const positionRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | undefined>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      // Lerp position for smooth following
      const lerpFactor = 0.1;
      positionRef.current.x += (targetRef.current.x - positionRef.current.x) * lerpFactor;
      positionRef.current.y += (targetRef.current.y - positionRef.current.y) * lerpFactor;

      const glow = document.getElementById("cursor-glow");
      if (glow) {
        glow.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      id="cursor-glow"
      className="fixed pointer-events-none z-[9999] w-[380px] h-[380px] rounded-full"
      style={{
        background: "radial-gradient(circle, rgba(139,92,246,0.055) 0%, transparent 65%)",
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}
