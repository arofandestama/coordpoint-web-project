'use client';

/**
 * EarthGlobe — cinematic 3D Earth rendered with react-three-fiber.
 *
 * Scene composition:
 * - glTF Earth normalized to a fixed radius (works with any model units)
 * - GIS-style wireframe graticule hugging the surface
 * - Two additive atmosphere shells + a soft fake-bloom glow sprite
 * - Coordinate pins (from the conversion samples) with pulsing surface rings
 * - Three tilted orbit rings with glowing travelling satellites
 * - Two-layer starfield with a twinkling bright layer
 * - Gentle idle float only — the globe does NOT follow the mouse
 *
 * Everything is sized to stay inside the transparent canvas so no container
 * edges are ever visible against the hero background.
 */
import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/** Normalized earth radius used by every scene element. */
const EARTH_RADIUS = 1.5;

/** Coordinate pins placed at the app's conversion sample locations. */
const SAMPLE_POINTS = [
  { lat: 49.50278, lon: -123.50556, phase: 0 },
  { lat: -6.2, lon: 106.82778, phase: 0.8 },
  { lat: 23.55, lon: -23.55, phase: 1.6 },
] as const;

interface EarthGlobeProps {
  className?: string;
}

/** Converts latitude/longitude (degrees) to a point on a sphere. */
function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** Soft radial-gradient texture used for fake-bloom glows (transparency-safe). */
function createGlowTexture(inner: string, mid: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.35, mid);
    gradient.addColorStop(1, 'rgba(0,180,216,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

/** The glTF Earth, normalized + graticule + atmosphere + coordinate pins. */
function Earth() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/earth.glb');

  // Normalize any source model to EARTH_RADIUS so the scene composition holds.
  const model = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3()).length();
    const scale = (EARTH_RADIUS * 2) / size;
    const normalized = scene.clone(true);
    normalized.scale.setScalar(scale);
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
    normalized.position.set(-center.x, -center.y, -center.z);
    return normalized;
  }, [scene]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.055;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.18, 0, 0.1]}>
      <primitive object={model} />

      {/* GIS graticule — lat/lon wireframe hugging the surface */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.008, 36, 18]} />
        <meshBasicMaterial color="#90e0ef" wireframe transparent opacity={0.05} />
      </mesh>

      {/* Atmosphere shells — backside spheres with additive glow */}
      <mesh scale={1.07}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color="#90e0ef"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.18}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color="#00b4d8"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Coordinate pins from the conversion samples */}
      {SAMPLE_POINTS.map((point) => (
        <SurfaceMarker
          key={`${point.lat},${point.lon}`}
          position={latLonToVec3(point.lat, point.lon, EARTH_RADIUS * 1.005)}
          phase={point.phase}
        />
      ))}
    </group>
  );
}

/** Coordinate pin with a pulsing surface ring (staggered per pin). */
function SurfaceMarker({ position, phase }: { position: THREE.Vector3; phase: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const normal = useMemo(() => position.clone().normalize(), [position]);
  const quaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal),
    [normal],
  );

  useFrame(({ clock }) => {
    const t = ((clock.getElapsedTime() + phase) % 2.4) / 2.4;
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + t * 5);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - t);
    }
  });

  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[0, 0.045, 0]}>
        <coneGeometry args={[0.03, 0.12, 16]} />
        <meshBasicMaterial color="#00b4d8" />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.1, 32]} />
        <meshBasicMaterial color="#90e0ef" transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** A satellite dot with an additive halo travelling along one ring. */
function Satellite({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const glow = useMemo(() => createGlowTexture('rgba(255,255,255,0.9)', 'rgba(144,224,239,0.4)'), []);

  useFrame(({ clock }) => {
    const angle = clock.getElapsedTime() * speed;
    ref.current?.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <sprite scale={0.5}>
        <spriteMaterial map={glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  );
}

/** Three tilted orbit rings, each carrying a glowing satellite. */
function OrbitRings() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  // Radii kept inside the camera frustum so rings never clip at canvas edges.
  const rings = [
    { radius: 1.85, tilt: 0.45, speed: 0.5, color: '#90e0ef' },
    { radius: 2.05, tilt: -0.3, speed: -0.32, color: '#00b4d8' },
    { radius: 2.25, tilt: 0.85, speed: 0.22, color: '#caf0f8' },
  ] as const;

  return (
    <group ref={groupRef}>
      {rings.map((ring) => (
        <group key={ring.radius} rotation={[ring.tilt, 0, ring.tilt * 0.35]}>
          <mesh>
            <torusGeometry args={[ring.radius, 0.007, 8, 160]} />
            <meshBasicMaterial color={ring.color} transparent opacity={0.32} />
          </mesh>
          <Satellite radius={ring.radius} speed={ring.speed} color={ring.color} />
        </group>
      ))}
    </group>
  );
}

/** Soft glow sprite behind the planet (fake bloom, transparency-safe). */
function BackGlow() {
  const glow = useMemo(
    () => createGlowTexture('rgba(144,224,239,0.45)', 'rgba(0,119,182,0.2)'),
    [],
  );
  return (
    <sprite position={[0, 0, -1.2]} scale={4.4}>
      <spriteMaterial
        map={glow}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  );
}

/** Two-layer starfield: dense faint dust + sparse twinkling stars. */
function Starfield() {
  const groupRef = useRef<THREE.Group>(null);
  const brightMaterialRef = useRef<THREE.PointsMaterial>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.008;
    }
    if (brightMaterialRef.current) {
      brightMaterialRef.current.opacity = 0.75 + Math.sin(clock.getElapsedTime() * 1.6) * 0.2;
    }
  });

  const layers = useMemo(() => {
    const build = (count: number, minRadius: number, spread: number, size: number, opacity: number) => {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const radius = minRadius + Math.random() * spread;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi);
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      return { geometry, size, opacity };
    };
    return [
      build(1400, 14, 26, 0.08, 0.7),
      build(220, 16, 24, 0.16, 0.95),
    ];
  }, []);

  return (
    <group ref={groupRef}>
      <points geometry={layers[0].geometry}>
        <pointsMaterial
          color="#caf0f8"
          size={layers[0].size}
          sizeAttenuation
          transparent
          opacity={layers[0].opacity}
          depthWrite={false}
        />
      </points>
      <points geometry={layers[1].geometry}>
        <pointsMaterial
          ref={brightMaterialRef}
          color="#e0fbfc"
          size={layers[1].size}
          sizeAttenuation
          transparent
          opacity={layers[1].opacity}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/** Gentle idle-float rig (no mouse following). */
function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }
  });
  return <group ref={ref}>{children}</group>;
}

/** Suspense fallback shown while the model streams in. */
function GlobeFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-[#90e0ef]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#90e0ef] border-t-transparent" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Memuat bumi…</p>
      </div>
    </Html>
  );
}

/**
 * Hero 3D globe canvas.
 *
 * @param props - {@link EarthGlobeProps} with an optional className for sizing.
 */
export default function EarthGlobe({ className }: EarthGlobeProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0.4, 7.2], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 4, 6]} intensity={1.3} color="#caf0f8" />
        <directionalLight position={[-6, -2, -4]} intensity={0.5} color="#0077b6" />
        <Suspense fallback={<GlobeFallback />}>
          <Rig>
            <BackGlow />
            <Earth />
            <OrbitRings />
            <Starfield />
          </Rig>
        </Suspense>
      </Canvas>
    </div>
  );
}

/** Warm the cache as soon as the module is evaluated on the client. */
useGLTF.preload('/models/earth.glb');