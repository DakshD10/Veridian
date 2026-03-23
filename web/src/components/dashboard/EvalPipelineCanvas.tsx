"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  label: string;
}

interface Particle {
  x: number;
  y: number;
  progress: number;
  speed: number;
  sourceNode: number;
  targetNode: number;
}

export function EvalPipelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = 400;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Define nodes: input → model → judge → score → compare → alert
    const nodeLabels = ["input", "model", "judge", "score", "compare", "alert"];
    const nodeSpacing = canvas.width / (nodeLabels.length + 1);
    const centerY = 120;

    const nodes: Node[] = nodeLabels.map((label, i) => ({
      x: nodeSpacing * (i + 1),
      y: centerY,
      label,
    }));

    // Initialize particles for each connection with different speeds
    const connections = nodes.length - 1;
    particlesRef.current = [];
    for (let i = 0; i < connections; i++) {
      const particleCount = 3;
      for (let j = 0; j < particleCount; j++) {
        particlesRef.current.push({
          x: 0,
          y: 0,
          progress: (j / particleCount) * 100,
          speed: 0.3 + Math.random() * 0.4, // Different speeds for organic feel
          sourceNode: i,
          targetNode: i + 1,
        });
      }
    }

    const drawNode = (node: Node) => {
      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "transparent";
      ctx.fill();

      // Draw label
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = "rgba(139, 92, 246, 0.5)";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + 24);
    };

    const drawConnection = (source: Node, target: Node) => {
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawParticle = (particle: Particle, source: Node, target: Node) => {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const x = source.x + (dx * particle.progress) / 100;
      const y = source.y + (dy * particle.progress) / 100;

      // Create radial gradient for glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
      gradient.addColorStop(0, "rgba(139, 92, 246, 0.8)");
      gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.3)");
      gradient.addColorStop(1, "rgba(139, 92, 246, 0)");

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw core dot
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#8B5CF6";
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all connections
      for (let i = 0; i < nodes.length - 1; i++) {
        drawConnection(nodes[i], nodes[i + 1]);
      }

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        particle.progress += particle.speed;
        if (particle.progress >= 100) {
          particle.progress = 0;
        }
        const source = nodes[particle.sourceNode];
        const target = nodes[particle.targetNode];
        drawParticle(particle, source, target);
      });

      // Draw all nodes
      nodes.forEach(drawNode);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-[400px] pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}
