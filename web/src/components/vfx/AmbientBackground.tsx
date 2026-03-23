"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const POINTS_COUNT = 50;
const BOUNDS = { x: 12, y: 6, z: 8 };
const BOX_SIZE = 0.018;
const VELOCITY_SCALE = 0.008;

interface PointData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

function createInitialPoints(): PointData[] {
  return Array.from({ length: POINTS_COUNT }, () => ({
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 2 * BOUNDS.x,
      (Math.random() - 0.5) * 2 * BOUNDS.y,
      (Math.random() - 0.5) * 2 * BOUNDS.z
    ),
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * VELOCITY_SCALE,
      (Math.random() - 0.5) * VELOCITY_SCALE,
      (Math.random() - 0.5) * VELOCITY_SCALE
    ),
  }));
}

function AnimatedPoints() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pointsDataRef = useRef<PointData[]>(createInitialPoints());
  const pointsData = pointsDataRef.current;

  useFrame(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < POINTS_COUNT; i++) {
      const point = pointsData[i];

      point.position.add(point.velocity);

      if (Math.abs(point.position.x) > BOUNDS.x) {
        point.velocity.x *= -1;
      }
      if (Math.abs(point.position.y) > BOUNDS.y) {
        point.velocity.y *= -1;
      }
      if (Math.abs(point.position.z) > BOUNDS.z) {
        point.velocity.z *= -1;
      }

      dummy.position.copy(point.position);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, POINTS_COUNT]}>
      <boxGeometry args={[BOX_SIZE, BOX_SIZE, BOX_SIZE]} />
      <meshStandardMaterial
        color="#8B5CF6"
        emissive="#8B5CF6"
        emissiveIntensity={0.6}
      />
    </instancedMesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.05} />
      <pointLight position={[4, 4, 4]} color="#8B5CF6" intensity={1.5} />
      <AnimatedPoints />
    </>
  );
}

export function AmbientBackground() {
  return (
    <div
      className="fixed top-0 left-0 w-screen h-screen pointer-events-none z-0"
      style={{ zIndex: 0 }}
    >
      <Suspense fallback={null}>
        <Canvas
          frameloop="demand"
          camera={{ position: [0, 0, 14] }}
          style={{ width: "100%", height: "100%" }}
          gl={{ antialias: false, alpha: true }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
