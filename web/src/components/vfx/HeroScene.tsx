"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const NODES_COUNT = 70;
const SIGNAL_PARTICLES_COUNT = 18;
const EDGE_THRESHOLD = 3.2;
const REGRESSION_INTERVAL = 5000; // 5 seconds

interface Node {
  position: THREE.Vector3;
  brightness: number;
  brightnessRef: { current: number };
}

interface Edge {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

interface SignalParticle {
  currentEdge: number;
  t: number;
  speed: number;
}

interface RegressionPulse {
  nodeId: number;
  scale: number;
  opacity: number;
  startTime: number;
}

function createInitialNodes(): Node[] {
  return Array.from({ length: NODES_COUNT }, () => {
    const brightnessRef = { current: 0.8 };
    return {
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 32, // -16 to 16
        (Math.random() - 0.5) * 16, // -8 to 8
        (Math.random() - 0.5) * 16  // -8 to 8
      ),
      brightness: 0.8,
      brightnessRef
    };
  });
}

function createEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const distance = nodes[i].position.distanceTo(nodes[j].position);
      if (distance < EDGE_THRESHOLD) {
        edges.push({
          start: nodes[i].position.clone(),
          end: nodes[j].position.clone()
        });
      }
    }
  }
  return edges;
}

function createSignalParticles(): SignalParticle[] {
  return Array.from({ length: SIGNAL_PARTICLES_COUNT }, () => ({
    currentEdge: Math.floor(Math.random() * 100), // Will be updated in useFrame
    t: Math.random(),
    speed: 0.003 + Math.random() * 0.004 // 0.003 to 0.007
  }));
}

function Scene() {
  const nodes = useMemo(() => createInitialNodes(), []);
  const edges = useMemo(() => createEdges(nodes), [nodes]);
  const [signalParticles, setSignalParticles] = useState<SignalParticle[]>(createSignalParticles());
  const [regressionPulse, setRegressionPulse] = useState<RegressionPulse | null>(null);
  const [lastRegressionTime, setLastRegressionTime] = useState(() => Date.now());

  // Create geometry for edges
  const edgeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    
    edges.forEach(edge => {
      positions.push(edge.start.x, edge.start.y, edge.start.z);
      positions.push(edge.end.x, edge.end.y, edge.end.z);
    });
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [edges]);

  useFrame(() => {
    const currentTime = Date.now();
    
    // Update signal particles
    setSignalParticles(prevParticles => {
      const updatedParticles = [...prevParticles];
      updatedParticles.forEach(particle => {
        // Update edge index if invalid
        if (particle.currentEdge >= edges.length) {
          particle.currentEdge = Math.floor(Math.random() * edges.length);
        }
        
        // Advance particle along edge
        particle.t += particle.speed;
        
        if (particle.t >= 1) {
          // Reset to new edge
          particle.currentEdge = Math.floor(Math.random() * edges.length);
          particle.t = 0;
          
          // Spike destination node brightness
          const edge = edges[particle.currentEdge];
          const destinationNode = nodes.find(node => 
            node.position.equals(edge.end)
          );
          if (destinationNode) {
            destinationNode.brightnessRef.current = 3.0;
          }
        }
      });
      return updatedParticles;
    });
    
    // Update node brightness (lerp back to 0.8)
    nodes.forEach(node => {
      if (node.brightnessRef.current > 0.8) {
        node.brightnessRef.current = Math.max(0.8, node.brightnessRef.current - 0.05);
      }
    });
    
    // Handle regression pulse
    if (currentTime - lastRegressionTime > REGRESSION_INTERVAL) {
      const randomNodeId = Math.floor(Math.random() * nodes.length);
      setRegressionPulse({
        nodeId: randomNodeId,
        scale: 0,
        opacity: 0.5,
        startTime: currentTime
      });
      setLastRegressionTime(currentTime);
    }
    
    // Animate regression pulse
    if (regressionPulse) {
      const elapsed = currentTime - regressionPulse.startTime;
      const progress = elapsed / 1200; // 1.2 seconds
      
      if (progress < 1) {
        setRegressionPulse({
          ...regressionPulse,
          scale: progress * 3,
          opacity: 0.5 * (1 - progress)
        });
      } else {
        setRegressionPulse(null);
      }
    }
  });

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.08} />
      <pointLight position={[6, 6, 6]} color="#8B5CF6" intensity={2} />
      <pointLight position={[-5, -4, -2]} color="#22C55E" intensity={1} />
      
      {/* Nodes */}
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color="#8B5CF6"
            emissive="#8B5CF6"
            emissiveIntensity={node.brightnessRef.current}
          />
        </mesh>
      ))}
      
      {/* Edges */}
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="#8B5CF6" opacity={0.12} transparent />
      </lineSegments>
      
      {/* Signal Particles */}
      {signalParticles.map((particle, i) => {
        const edge = edges[particle.currentEdge];
        if (!edge) return null;
        
        const position = new THREE.Vector3().lerpVectors(
          edge.start,
          edge.end,
          particle.t
        );
        
        return (
          <mesh key={i} position={position}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial
              color="#22C55E"
              emissive="#22C55E"
              emissiveIntensity={2.0}
            />
          </mesh>
        );
      })}
      
      {/* Regression Pulse */}
      {regressionPulse && (
        <mesh position={nodes[regressionPulse.nodeId].position} scale={regressionPulse.scale}>
          <torusGeometry args={[1, 0.1, 16, 100]} />
          <meshStandardMaterial
            color="#EF4444"
            transparent
            opacity={regressionPulse.opacity}
          />
        </mesh>
      )}
      
      {/* OrbitControls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function HeroScene() {
  return (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <Canvas
        frameloop="always"
        camera={{ position: [0, 0, 14] }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene />
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.15}
              luminanceSmoothing={0.9}
              intensity={1.2}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
