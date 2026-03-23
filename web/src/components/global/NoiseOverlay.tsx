"use client";

export function NoiseOverlay() {
  // Base64 encoded SVG noise filter with feTurbulence
  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[5]"
      style={{
        opacity: 0.025,
        backgroundImage: noiseSvg,
        mixBlendMode: "overlay",
      }}
    />
  );
}
