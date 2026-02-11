'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, AdditiveBlending, BackSide, DoubleSide } from 'three';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import { useSpring, animated } from '@react-spring/three';

interface CenterRobotProps {
  enableAnimations?: boolean;
}

/**
 * CenterRobot - Visually impressive robot at the origin representing Claude Code.
 * Features: chrome head, glass visor, energy core, holographic rings,
 * orbiting data particles, floating shield hexagons, and signal pulses.
 */
export default function CenterRobot({ enableAnimations = true }: CenterRobotProps) {
  const robotRef = useRef<Group>(null);
  const ring1Ref = useRef<Mesh>(null);
  const ring2Ref = useRef<Mesh>(null);
  const orbitGroup1Ref = useRef<Group>(null);
  const orbitGroup2Ref = useRef<Group>(null);
  const orbitGroup3Ref = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const shieldGroupRef = useRef<Group>(null);
  const pulseRefs = useRef<Mesh[]>([]);
  const pulseInnerRefs = useRef<Mesh[]>([]);

  const { nodes, setSelectedNode, signalPulseActive } = useKnowledgeStore();
  const [clicked, setClicked] = useState(false);
  const [pulses, setPulses] = useState<number[]>([]);
  const pulseIdRef = useRef(0);

  const pulseSpring = useSpring({
    scale: clicked ? 1.3 : 1.0,
    config: { tension: 200, friction: 20 },
    onRest: () => setClicked(false),
  });

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    setClicked(true);
    const centerNode = nodes.find((n) => n.id === 'center');
    if (centerNode) {
      setSelectedNode(centerNode);
    }
  }, [nodes, setSelectedNode]);

  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'default';
  }, []);

  // Shield hexagon positions (6 pieces in partial sphere)
  const shieldPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const y = (i % 2 === 0 ? 0.3 : -0.3);
      positions.push([
        Math.cos(angle) * 1.5,
        y,
        Math.sin(angle) * 1.5,
      ]);
    }
    return positions;
  }, []);

  const lastPulseState = useRef(false);

  useFrame((state) => {
    if (!enableAnimations) return;

    const time = state.clock.elapsedTime;

    // Gentle Y-axis bobbing
    if (robotRef.current) {
      robotRef.current.position.y = Math.sin(time * 0.8) * 0.1;
    }

    // Holographic ring counter-rotation
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * 0.5;
      ring1Ref.current.rotation.x = Math.sin(time * 0.3) * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -time * 0.4;
      ring2Ref.current.rotation.y = Math.cos(time * 0.25) * 0.3;
    }

    // Orbiting data particles
    if (orbitGroup1Ref.current) {
      orbitGroup1Ref.current.rotation.y = time * 0.8;
    }
    if (orbitGroup2Ref.current) {
      orbitGroup2Ref.current.rotation.y = -time * 0.6;
      orbitGroup2Ref.current.rotation.x = 0.4;
    }
    if (orbitGroup3Ref.current) {
      orbitGroup3Ref.current.rotation.z = time * 0.7;
      orbitGroup3Ref.current.rotation.x = -0.3;
    }

    // Energy core rotation and pulsing
    if (coreRef.current) {
      coreRef.current.rotation.x = time * 1.5;
      coreRef.current.rotation.y = time * 1.2;
      const mat = coreRef.current.material as any;
      if (mat && 'emissiveIntensity' in mat) {
        mat.emissiveIntensity = 2.0 + Math.sin(time * 3) * 1.0;
      }
    }

    // Shield pieces subtle float
    if (shieldGroupRef.current) {
      shieldGroupRef.current.rotation.y = time * 0.15;
      shieldGroupRef.current.children.forEach((child, i) => {
        child.position.y = shieldPositions[i][1] + Math.sin(time * 0.5 + i) * 0.1;
      });
    }

    // Spawn pulse when signal activates
    if (signalPulseActive && !lastPulseState.current) {
      const id = ++pulseIdRef.current;
      setPulses(prev => [...prev, id]);
      setTimeout(() => {
        setPulses(prev => prev.filter(p => p !== id));
      }, 2000);
    }
    lastPulseState.current = signalPulseActive;

    // Animate pulse rings (dual-color)
    pulseRefs.current.forEach((mesh) => {
      if (!mesh) return;
      const mat = mesh.material as any;
      const currentScale = mesh.scale.x;
      const newScale = currentScale + state.clock.getDelta() * 10;
      mesh.scale.setScalar(newScale);
      if (mat && 'opacity' in mat) {
        mat.opacity = Math.max(0, 1 - newScale / 15);
      }
    });
    pulseInnerRefs.current.forEach((mesh) => {
      if (!mesh) return;
      const mat = mesh.material as any;
      const currentScale = mesh.scale.x;
      const newScale = currentScale + state.clock.getDelta() * 12;
      mesh.scale.setScalar(newScale);
      if (mat && 'opacity' in mat) {
        mat.opacity = Math.max(0, 0.8 - newScale / 12);
      }
    });
  });

  return (
    <group ref={robotRef} position={[0, 0, 0]}>
      {/* ===== HEAD - Chrome sphere ===== */}
      <animated.mesh
        castShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={pulseSpring.scale}
        position={[0, 0.6, 0]}
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshPhysicalMaterial
          color="#2a2a3e"
          metalness={0.95}
          roughness={0.05}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          reflectivity={1.0}
        />
      </animated.mesh>

      {/* ===== VISOR - Glass band with transmission ===== */}
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.18, 32]} />
        <meshPhysicalMaterial
          color="#00FFFF"
          metalness={0.1}
          roughness={0.05}
          transmission={0.7}
          thickness={0.5}
          ior={1.5}
          transparent
          opacity={0.85}
          emissive="#00FFFF"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* ===== EYES - Two small emissive cyan dots behind visor ===== */}
      <mesh position={[-0.18, 0.62, 0.5]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00FFFF"
          emissiveIntensity={3}
        />
      </mesh>
      <mesh position={[0.18, 0.62, 0.5]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00FFFF"
          emissiveIntensity={3}
        />
      </mesh>

      {/* ===== BODY - Dark metallic rounded box ===== */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.65]} />
        <meshPhysicalMaterial
          color="#0f0f1a"
          metalness={0.8}
          roughness={0.2}
          clearcoat={0.5}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* ===== CHEST PLATE - Semi-transparent showing energy core ===== */}
      <mesh position={[0, -0.1, 0.34]}>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshPhysicalMaterial
          color="#1a1a3e"
          metalness={0.2}
          roughness={0.1}
          transmission={0.6}
          thickness={0.3}
          ior={1.4}
          transparent
          opacity={0.6}
          emissive="#00FFFF"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* ===== ENERGY CORE - Rotating emissive icosahedron ===== */}
      <mesh ref={coreRef} position={[0, -0.1, 0.15]}>
        <icosahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00FFFF"
          emissiveIntensity={2.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Energy core inner glow */}
      <pointLight position={[0, -0.1, 0.15]} intensity={0.8} distance={3} color="#00FFFF" />

      {/* ===== HOLOGRAPHIC PROJECTION RINGS ===== */}
      <mesh ref={ring1Ref} position={[0, 0.2, 0]} rotation={[0.6, 0, 0]}>
        <torusGeometry args={[1.2, 0.02, 8, 64]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00FFFF"
          emissiveIntensity={1.5}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 0.2, 0]} rotation={[-0.4, 0.8, 0]}>
        <torusGeometry args={[1.4, 0.015, 8, 64]} />
        <meshStandardMaterial
          color="#FF00FF"
          emissive="#FF00FF"
          emissiveIntensity={1.2}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* ===== ORBITING DATA PARTICLES ===== */}
      <group ref={orbitGroup1Ref}>
        <mesh position={[1.6, 0, 0]}>
          <icosahedronGeometry args={[0.08, 0]} />
          <meshStandardMaterial
            color="#00FFFF"
            emissive="#00FFFF"
            emissiveIntensity={2}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
      <group ref={orbitGroup2Ref}>
        <mesh position={[0, 0, 1.8]}>
          <icosahedronGeometry args={[0.06, 0]} />
          <meshStandardMaterial
            color="#FF00FF"
            emissive="#FF00FF"
            emissiveIntensity={2}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
      <group ref={orbitGroup3Ref}>
        <mesh position={[-1.5, 0.3, 0]}>
          <icosahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial
            color="#FFA500"
            emissive="#FFA500"
            emissiveIntensity={2}
            transparent
            opacity={0.75}
          />
        </mesh>
      </group>

      {/* ===== FLOATING SHIELD HEXAGONS ===== */}
      <group ref={shieldGroupRef}>
        {shieldPositions.map((pos, i) => (
          <mesh key={`shield-${i}`} position={pos} rotation={[0, (i / 6) * Math.PI * 2, 0]}>
            <circleGeometry args={[0.2, 6]} />
            <meshStandardMaterial
              color="#00FFFF"
              emissive="#00FFFF"
              emissiveIntensity={0.3}
              transparent
              opacity={0.12}
              side={DoubleSide}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Head point light */}
      <pointLight position={[0, 0.6, 0]} intensity={0.5} distance={5} color="#00FFFF" />

      {/* ===== SIGNAL PULSE RINGS (dual-color) ===== */}
      {pulses.map((id, i) => (
        <group key={id}>
          {/* Outer cyan ring */}
          <mesh
            ref={(el) => { if (el) pulseRefs.current[i] = el; }}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.1, 0.1, 0.1]}
          >
            <torusGeometry args={[1, 0.04, 8, 64]} />
            <meshBasicMaterial
              color="#00FFFF"
              transparent
              opacity={1}
            />
          </mesh>
          {/* Inner magenta ring */}
          <mesh
            ref={(el) => { if (el) pulseInnerRefs.current[i] = el; }}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.08, 0.08, 0.08]}
          >
            <torusGeometry args={[0.8, 0.03, 8, 64]} />
            <meshBasicMaterial
              color="#FF00FF"
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
