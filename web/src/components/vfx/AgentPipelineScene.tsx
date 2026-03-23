"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

interface TraceNode {
  node: string;
  timestamp: string;
  summary: string;
  status: "done" | "pending" | "running" | "error";
  reportSummary?: string | null;
}

interface AgentPipelineSceneProps {
  traceNodes: TraceNode[];
  regressionFound: boolean;
}

// Node positions in organic curved path
const NODE_POSITIONS = [
  [-1.5,  4.0, 0],  // trigger_received
  [-0.5,  2.8, 0.3], // load_eval_suite
  [ 0.8,  1.5, -0.2], // run_model
  [ 0.2,  0.3, 0.4], // score_results
  [-0.8, -1.0, -0.1], // compare_baseline
  [ 0.5, -2.3, 0.2], // generate_report
  [-0.3, -3.6, 0],   // notify
];

const NODE_ORDER = [
  "trigger_received",
  "load_eval_suite", 
  "run_model",
  "score_results",
  "compare_baseline",
  "generate_report",
  "notify"
];

function getNodeColor(status: TraceNode["status"]): { color: string; emissive: string; emissiveIntensity: number } {
  switch (status) {
    case "done":
      return { color: "#22C55E", emissive: "#22C55E", emissiveIntensity: 1.5 };
    case "running":
      return { color: "#8B5CF6", emissive: "#8B5CF6", emissiveIntensity: 3 };
    case "pending":
      return { color: "#27272A", emissive: "#27272A", emissiveIntensity: 0.1 };
    case "error":
      return { color: "#EF4444", emissive: "#EF4444", emissiveIntensity: 2 };
    default:
      return { color: "#27272A", emissive: "#27272A", emissiveIntensity: 0.1 };
  }
}

function getTubeColor(fromStatus: TraceNode["status"], toStatus: TraceNode["status"]): { color: string; opacity: number; emissive?: string; emissiveIntensity?: number } {
  if (fromStatus === "done" && toStatus === "done") {
    return { color: "#22C55E", opacity: 0.7 };
  }
  if (fromStatus === "done" && toStatus === "running") {
    return { color: "#8B5CF6", opacity: 1.0, emissive: "#8B5CF6", emissiveIntensity: 0.5 };
  }
  return { color: "#1F1F23", opacity: 0.3 };
}

// Seeded random function for deterministic particle generation
function seededRandom(seed: number): () => number {
  let state = seed;
  return function() {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function Scene({ traceNodes, regressionFound }: AgentPipelineSceneProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const particleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const regressionRef = useRef<THREE.Mesh | null>(null);
  const regressionScaleRef = useRef(0);
  
  // Create ambient particles with deterministic seeded random
  const ambientParticles = useMemo(() => {
    const random = seededRandom(12345); // Fixed seed for consistency
    return Array.from({ length: 30 }, () => ({
      position: new THREE.Vector3(
        (random() - 0.5) * 6,
        (random() - 0.5) * 8,
        (random() - 0.5) * 2
      ),
      phase: random() * Math.PI * 2,
      speed: 0.2 + random() * 0.3
    }));
  }, []);

  // Create curves between consecutive nodes
  const curves = useMemo(() => {
    const curves: THREE.CatmullRomCurve3[] = [];
    for (let i = 0; i < NODE_POSITIONS.length - 1; i++) {
      const start = new THREE.Vector3(...NODE_POSITIONS[i]);
      const end = new THREE.Vector3(...NODE_POSITIONS[i + 1]);
      
      // Create control points for S-curve
      const mid = start.clone().lerp(end, 0.5);
      mid.x += Math.sin(i * 0.5) * 0.8; // Add organic curve
      mid.z += Math.cos(i * 0.7) * 0.4;
      
      const points = [start, mid, end];
      curves.push(new THREE.CatmullRomCurve3(points));
    }
    return curves;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Animate running nodes with scale oscillation
    meshRefs.current.forEach((mesh, i) => {
      if (mesh && i < traceNodes.length) {
        const status = traceNodes[i].status;
        if (status === "running") {
          const scale = Math.sin(time * 3) * 0.08 + 1;
          mesh.scale.setScalar(scale);
        } else {
          mesh.scale.setScalar(1);
        }
      }
    });

    // Animate signal particles along curves
    curves.forEach((curve, curveIndex) => {
      const fromStatus = curveIndex < traceNodes.length ? traceNodes[curveIndex].status : "pending";
      const toStatus = curveIndex + 1 < traceNodes.length ? traceNodes[curveIndex + 1].status : "pending";
      
      // Only spawn particles for active connections
      if (fromStatus === "done" && (toStatus === "done" || toStatus === "running")) {
        const particleIndex = curveIndex;
        const particle = particleRefs.current[particleIndex];
        
        if (particle) {
          const t = (time * 0.8 + curveIndex * 0.3) % 1; // Stagger particle timing
          const position = curve.getPoint(t);
          particle.position.copy(position);
          particle.visible = true;
        }
      } else {
        const particle = particleRefs.current[curveIndex];
        if (particle) particle.visible = false;
      }
    });

    // Animate ambient particles
    ambientParticles.forEach((particle, i) => {
      const mesh = particleRefs.current[7 + i]; // Start after signal particles
      if (mesh) {
        mesh.position.x = particle.position.x + Math.sin(time * particle.speed + particle.phase) * 0.5;
        mesh.position.y = particle.position.y + Math.cos(time * particle.speed * 0.7 + particle.phase) * 0.3;
        mesh.position.z = particle.position.z + Math.sin(time * particle.speed * 1.2 + particle.phase) * 0.2;
      }
    });

    // Regression shockwave effect
    if (regressionFound && regressionRef.current) {
      regressionScaleRef.current = (regressionScaleRef.current + 0.01) % 1.5;
      const scale = regressionScaleRef.current * 5;
      regressionRef.current.scale.set(scale, scale, scale * 0.3);
      regressionRef.current.rotation.z = time * 2;
      
      const opacity = Math.max(0, 1 - regressionScaleRef.current / 1.5);
      (regressionRef.current.material as THREE.MeshStandardMaterial).opacity = opacity;
    }

    // Camera breathing movement
    const camera = state.camera;
    camera.position.x = Math.sin(time * 0.3) * 0.8;
    camera.position.y = Math.cos(time * 0.2) * 0.4;
    camera.lookAt(0, 0, 0);
  });

  // Get node data for rendering
  const nodeData = NODE_ORDER.map((nodeName) => {
    const traceNode = traceNodes.find(n => n.node === nodeName);
    return {
      nodeName,
      status: traceNode?.status || "pending"
    };
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.05} />
      <pointLight position={[3, 5, 4]} color="#8B5CF6" intensity={2.5} />
      <pointLight position={[-3, -4, 2]} color="#22C55E" intensity={1.5} />
      <pointLight position={[0, 0, 6]} color="#FFFFFF" intensity={0.3} />

      {/* Nodes */}
      {nodeData.map((node, i) => {
        const { color, emissive, emissiveIntensity } = getNodeColor(node.status);
        const position = new THREE.Vector3(...NODE_POSITIONS[i]);
        
        return (
          <group key={node.nodeName} position={position}>
            <mesh
              ref={el => meshRefs.current[i] = el}
            >
              <octahedronGeometry args={[0.22]} />
              <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
            
            {/* Node Label */}
            <Html position={[0.4, 0, 0]} center>
              <div className={`font-mono text-[10px] ${
                node.status === "done" ? "text-green-500" : 
                node.status === "running" ? "text-violet-400 animate-pulse" : 
                "text-[#3F3F46]"
              }`}>
                {node.nodeName.replace(/_/g, " ")}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Tube Connections */}
      {curves.map((curve, i) => {
        const fromStatus = nodeData[i]?.status || "pending";
        const toStatus = nodeData[i + 1]?.status || "pending";
        const { color, opacity, emissive, emissiveIntensity } = getTubeColor(fromStatus, toStatus);
        
        return (
          <mesh key={`tube-${i}`}>
            <tubeGeometry args={[curve, 64, 0.012, 8, false]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={opacity}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity || 0}
            />
          </mesh>
        );
      })}

      {/* Signal Particles */}
      {curves.map((curve, i) => (
        <mesh
          key={`signal-${i}`}
          ref={el => particleRefs.current[i] = el}
          visible={false}
        >
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial
            color="#22C55E"
            emissive="#22C55E"
            emissiveIntensity={3}
          />
        </mesh>
      ))}

      {/* Ambient Particles */}
      {ambientParticles.map((particle, i) => (
        <mesh
          key={`ambient-${i}`}
          ref={el => particleRefs.current[7 + i] = el}
          position={particle.position}
        >
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial
            color="#8B5CF6"
            emissive="#8B5CF6"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}

      {/* Regression Shockwave */}
      {regressionFound && (
        <mesh
          ref={regressionRef}
          position={[NODE_POSITIONS[4][0], NODE_POSITIONS[4][1], NODE_POSITIONS[4][2]]} // compare_baseline position
        >
          <torusGeometry args={[1, 0.1, 16, 100]} />
          <meshStandardMaterial
            color="#EF4444"
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </>
  );
}

export default function AgentPipelineScene({ traceNodes, regressionFound }: AgentPipelineSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        frameloop="always"
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene traceNodes={traceNodes} regressionFound={regressionFound} />
          <EffectComposer>
            <Bloom 
              luminanceThreshold={0.1} 
              intensity={1.8} 
              luminanceSmoothing={0.9} 
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
