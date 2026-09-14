'use client';

/**
 * @module EarthGlobe
 * @description High-performance 3D Earth rendered using React Three Fiber and Three.js.
 * Loads the Draco-compressed 3D Earth model (/models/earth-compressed.glb, ~4.96 MB)
 * with procedural fallback, atmosphere glow, and viewport-based frameloop auto-pausing.
 *
 * @see {@link https://threejs.org/docs/}
 * @see {@link https://docs.pmnd.rs/react-three-fiber/}
 */
import { Component, memo, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Suppress THREE.Clock deprecation warning emitted by Three.js / R3F
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('THREE.Clock: This module has been deprecated')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

/** Normalized Earth sphere radius */
const EARTH_RADIUS = 1.6;
const COMPRESSED_MODEL_PATH = '/models/earth-compressed.glb';

interface EarthGlobeProps {
  className?: string;
}

/**
 * Procedural Earth sphere rendered as a fallback.
 */
function ProceduralEarth() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.045;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.22, 0, 0.08]}>
      {/* Ocean base sphere */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial color="#0077b6" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Lat/Lon graticule wireframe */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.004, 36, 18]} />
        <meshBasicMaterial color="#90e0ef" wireframe transparent opacity={0.15} />
      </mesh>

    </group>
  );
}

/**
 * Renders the Draco-compressed glTF Earth model with gentle rotation.
 */
function EarthModel() {
  const groupRef = useRef<THREE.Group>(null);
  // Pass `true` as 2nd argument to enable Drei's automatic Draco decoder
  const { scene } = useGLTF(COMPRESSED_MODEL_PATH, true);

  // Normalize source model scale and center it
  const model = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3()).length();
    const scale = size > 0 ? (EARTH_RADIUS * 2) / size : 1;
    const normalized = scene.clone(true);
    normalized.scale.setScalar(scale);
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
    normalized.position.set(-center.x, -center.y, -center.z);
    return normalized;
  }, [scene]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.045;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.22, 0, 0.08]}>
      <primitive object={model} />
    </group>
  );
}

/**
 * Gentle floating rig wrapper.
 */
function FloatingRig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
    }
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * Suspense fallback displayed while the model is downloading.
 */
function GlobeFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-[#90e0ef]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#90e0ef] border-t-transparent" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Memuat 3D Bumi…</p>
      </div>
    </Html>
  );
}

/**
 * Error boundary so if the fetch fails, it falls back to Procedural Earth without crashing.
 */
class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[EarthGlobe] Model load fallback engaged:', error.message);
  }

  render() {
    if (this.state.failed) {
      return (
        <FloatingRig>
          <ProceduralEarth />
        </FloatingRig>
      );
    }
    return this.props.children;
  }
}

/**
 * 3D Earth Globe Canvas Component with IntersectionObserver auto-pause for zero scroll lag.
 */
function EarthGlobeComponent({ className }: EarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    const target = containerRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ willChange: 'transform' }}>
      <Canvas
        camera={{ position: [0, 0.35, 7.2], fov: 38 }}
        dpr={[1, 1.25]}
        frameloop={isInView ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent', visibility: isInView ? 'visible' : 'hidden' }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 4, 6]} intensity={1.5} color="#caf0f8" />
        <directionalLight position={[-6, -2, -4]} intensity={0.5} color="#0077b6" />
        <Suspense fallback={<GlobeFallback />}>
          <SceneErrorBoundary>
            <FloatingRig>
              <EarthModel />
            </FloatingRig>
          </SceneErrorBoundary>
        </Suspense>
      </Canvas>
    </div>
  );
}

/** Memoized export to prevent canvas re-renders when parent state updates. */
export const EarthGlobe = memo(EarthGlobeComponent);
export default EarthGlobe;

// Preload compressed glTF model with Draco support
try {
  useGLTF.preload(COMPRESSED_MODEL_PATH, true);
} catch {
  // Handled by SceneErrorBoundary
}








// Semoga Diterima.. 