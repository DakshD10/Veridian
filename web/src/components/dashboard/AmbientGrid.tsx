"use client";

export function AmbientGrid() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: `
          radial-gradient(ellipse 80% 40% at 50% 0%, rgba(139, 92, 246, 0.07) 0%, transparent 100%),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 47px,
            rgba(139, 92, 246, 0.04) 47px,
            rgba(139, 92, 246, 0.04) 48px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 47px,
            rgba(139, 92, 246, 0.04) 47px,
            rgba(139, 92, 246, 0.04) 48px
          )
        `,
      }}
    />
  );
}
