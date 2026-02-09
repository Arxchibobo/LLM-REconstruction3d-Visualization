'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

/**
 * SpaceBackground - Deep space with Milky Way band, enhanced nebulae,
 * twinkling bright stars, and rich color variety.
 */
export default function SpaceBackground() {
  const distantStarsRef = useRef<THREE.Points>(null);
  const midStarsRef = useRef<THREE.Points>(null);
  const nearStarsRef = useRef<THREE.Points>(null);
  const milkyWayRef = useRef<THREE.Points>(null);
  const twinkleRef = useRef<THREE.Points>(null);

  // Layer 1: Distant stars (warm tones)
  const distantStars = useMemo(() => {
    const count = 1200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 150 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  // Layer 2: Mid-range stars (blue-white)
  const midStars = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 100 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  // Layer 3: Near stars (bright white with occasional warm star)
  const nearStars = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 60 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  // Milky Way band: 3000 particles in a flat disc with Gaussian concentration
  const milkyWayData = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const warmColors = [
      new THREE.Color('#FFE4B5'), // Moccasin
      new THREE.Color('#DEB887'), // BurlyWood
      new THREE.Color('#FFDAB9'), // PeachPuff
      new THREE.Color('#F5DEB3'), // Wheat
      new THREE.Color('#D2B48C'), // Tan
    ];

    for (let i = 0; i < count; i++) {
      // Flat disc with Gaussian Y spread
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 150;
      // Gaussian concentration toward center band
      const gaussianY = (Math.random() + Math.random() + Math.random() - 1.5) * 3;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = gaussianY;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 80; // Push behind scene

      // Mixed warm colors
      const c = warmColors[Math.floor(Math.random() * warmColors.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, []);

  // Twinkling bright stars: 40 larger stars with animated opacity
  const twinkleStars = useMemo(() => {
    const count = 40;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count); // For varied twinkle timing
    for (let i = 0; i < count; i++) {
      const radius = 80 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, phases };
  }, []);

  // Parallax + twinkle animation
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (distantStarsRef.current) {
      distantStarsRef.current.rotation.y += 0.00008;
    }
    if (midStarsRef.current) {
      midStarsRef.current.rotation.y += 0.00015;
    }
    if (nearStarsRef.current) {
      nearStarsRef.current.rotation.y += 0.00025;
    }
    if (milkyWayRef.current) {
      milkyWayRef.current.rotation.y += 0.00005;
    }

    // Twinkle effect for bright stars
    if (twinkleRef.current) {
      const mat = twinkleRef.current.material as THREE.PointsMaterial;
      // Global twinkle via opacity oscillation
      mat.opacity = 0.5 + Math.sin(time * 1.5) * 0.3;
    }
  });

  // Enhanced nebula clusters: overlapping transparent spheres for depth
  const nebulaeClusters = useMemo(() => [
    {
      center: [60, 30, -120] as [number, number, number],
      color: '#3A1F6E',
      spheres: [
        { offset: [0, 0, 0], size: 35, opacity: 0.05 },
        { offset: [5, -3, 8], size: 28, opacity: 0.04 },
        { offset: [-8, 5, -5], size: 22, opacity: 0.06 },
        { offset: [3, 8, 3], size: 30, opacity: 0.03 },
        { offset: [-5, -6, 10], size: 25, opacity: 0.05 },
        { offset: [10, 2, -8], size: 20, opacity: 0.04 },
      ],
    },
    {
      center: [-80, -20, -100] as [number, number, number],
      color: '#1F3A6E',
      spheres: [
        { offset: [0, 0, 0], size: 40, opacity: 0.06 },
        { offset: [8, 5, -5], size: 32, opacity: 0.05 },
        { offset: [-6, -8, 8], size: 28, opacity: 0.04 },
        { offset: [4, 10, 3], size: 35, opacity: 0.03 },
        { offset: [-10, 3, -6], size: 24, opacity: 0.06 },
        { offset: [6, -5, 10], size: 30, opacity: 0.04 },
      ],
    },
    {
      center: [30, -50, -140] as [number, number, number],
      color: '#6E1F3A',
      spheres: [
        { offset: [0, 0, 0], size: 50, opacity: 0.04 },
        { offset: [12, -8, 5], size: 38, opacity: 0.05 },
        { offset: [-8, 10, -10], size: 32, opacity: 0.03 },
        { offset: [5, 5, 12], size: 42, opacity: 0.04 },
        { offset: [-12, -5, 8], size: 28, opacity: 0.06 },
        { offset: [8, -12, -5], size: 35, opacity: 0.03 },
      ],
    },
    {
      center: [-40, 60, -110] as [number, number, number],
      color: '#1F6E5A',
      spheres: [
        { offset: [0, 0, 0], size: 30, opacity: 0.07 },
        { offset: [6, -4, 5], size: 25, opacity: 0.05 },
        { offset: [-5, 6, -8], size: 20, opacity: 0.06 },
        { offset: [3, 8, 3], size: 28, opacity: 0.04 },
        { offset: [-8, -3, 6], size: 22, opacity: 0.05 },
        { offset: [5, 5, -5], size: 18, opacity: 0.08 },
      ],
    },
    {
      center: [100, 10, -90] as [number, number, number],
      color: '#4A1F6E',
      spheres: [
        { offset: [0, 0, 0], size: 28, opacity: 0.05 },
        { offset: [5, -5, 3], size: 22, opacity: 0.04 },
        { offset: [-3, 4, -6], size: 18, opacity: 0.06 },
        { offset: [8, 2, 5], size: 25, opacity: 0.03 },
        { offset: [-6, -3, 8], size: 20, opacity: 0.05 },
        { offset: [3, 6, -3], size: 15, opacity: 0.07 },
      ],
    },
  ], []);

  return (
    <>
      {/* Deep space background */}
      <color attach="background" args={['#030510']} />
      <fog attach="fog" args={['#0A0F20', 100, 250]} />

      {/* Distant stars - warm tones */}
      <Points
        ref={distantStarsRef}
        positions={distantStars}
        stride={3}
        frustumCulled={false}
      >
        <PointMaterial
          transparent
          color="#FFE4B5"
          size={0.12}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.25}
        />
      </Points>

      {/* Mid-range stars - blue-white */}
      <Points
        ref={midStarsRef}
        positions={midStars}
        stride={3}
        frustumCulled={false}
      >
        <PointMaterial
          transparent
          color="#B8C9FF"
          size={0.1}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.4}
        />
      </Points>

      {/* Near stars - bright white */}
      <Points
        ref={nearStarsRef}
        positions={nearStars}
        stride={3}
        frustumCulled={false}
      >
        <PointMaterial
          transparent
          color="#E0E8FF"
          size={0.08}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.55}
        />
      </Points>

      {/* Milky Way band */}
      <points ref={milkyWayRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={milkyWayData.positions.length / 3}
            array={milkyWayData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={milkyWayData.colors.length / 3}
            array={milkyWayData.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.15}
          transparent
          opacity={0.12}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Twinkling bright stars */}
      <Points
        ref={twinkleRef}
        positions={twinkleStars.positions}
        stride={3}
        frustumCulled={false}
      >
        <PointMaterial
          transparent
          color="#FFFFFF"
          size={0.4}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      {/* Enhanced nebula clusters - overlapping transparent spheres */}
      {nebulaeClusters.map((cluster, ci) => (
        <group key={`nebula-${ci}`} position={cluster.center}>
          {cluster.spheres.map((sphere, si) => (
            <mesh
              key={`nebula-${ci}-${si}`}
              position={sphere.offset as [number, number, number]}
            >
              <sphereGeometry args={[sphere.size, 16, 16]} />
              <meshBasicMaterial
                color={cluster.color}
                transparent
                opacity={sphere.opacity}
                side={THREE.BackSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Ambient light - slightly brighter for deep space */}
      <ambientLight intensity={0.4} color="#0A1530" />

      {/* Main directional light */}
      <directionalLight
        position={[20, 20, 10]}
        intensity={0.9}
        color="#E6F1FF"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Fill light */}
      <directionalLight
        position={[-15, -10, -10]}
        intensity={0.25}
        color="#4A5FC1"
      />

      {/* Background point light */}
      <pointLight
        position={[0, 40, -80]}
        intensity={0.15}
        color="#5B8EFF"
        distance={120}
      />

      {/* Warm fill from milky way direction */}
      <pointLight
        position={[50, 0, -100]}
        intensity={0.1}
        color="#FFE4B5"
        distance={150}
      />
    </>
  );
}
