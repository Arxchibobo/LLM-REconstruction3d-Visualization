'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import type { WorkspaceModule, ModuleType } from '@/types/workspace';
import { NODE_TYPE_COLORS, NODE_TYPE_SHAPES } from '@/types/knowledge';
import type { ShapeType, NodeType } from '@/types/knowledge';

// Map ModuleType → NodeType for color/shape lookup
const MODULE_TO_NODE_TYPE: Record<ModuleType, NodeType> = {
  skill: 'skill',
  mcp: 'mcp',
  plugin: 'plugin',
  hook: 'hook',
  rule: 'rule',
  agent: 'agent',
  memory: 'memory',
};

function getGeometry(shape: ShapeType) {
  switch (shape) {
    case 'cube':
    case 'box':
      return <boxGeometry args={[1.5, 1.5, 1.5]} />;
    case 'cylinder':
      return <cylinderGeometry args={[0.8, 0.8, 1.5, 16]} />;
    case 'octahedron':
      return <octahedronGeometry args={[1.0]} />;
    case 'torus':
      return <torusGeometry args={[0.7, 0.25, 16, 32]} />;
    case 'dodecahedron':
      return <dodecahedronGeometry args={[0.9]} />;
    case 'icosahedron':
      return <icosahedronGeometry args={[0.9]} />;
    case 'cone':
      return <coneGeometry args={[0.8, 1.5, 16]} />;
    case 'sphere':
    default:
      return <sphereGeometry args={[0.9, 16, 16]} />;
  }
}

interface ModuleNodeProps {
  module: WorkspaceModule;
  position: [number, number, number];
  onClick?: () => void;
}

export default function ModuleNode({ module, position, onClick }: ModuleNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const nodeType = MODULE_TO_NODE_TYPE[module.type];
  const color = NODE_TYPE_COLORS[nodeType] || '#888888';
  const shape = NODE_TYPE_SHAPES[nodeType] || 'sphere';

  // Gentle rotation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  // Spring animation for hover
  const { scale, emissiveIntensity } = useSpring({
    scale: hovered ? 1.3 : 1.0,
    emissiveIntensity: hovered ? 0.8 : 0.3,
    config: { tension: 300, friction: 20 },
  });

  return (
    <group position={position}>
      <animated.mesh
        ref={meshRef}
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {getGeometry(shape)}
        <animated.meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.4}
          metalness={0.6}
          transparent
          opacity={0.9}
        />
      </animated.mesh>

      {/* Glow halo */}
      <mesh scale={1.4}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.15 : 0.05}
          depthWrite={false}
        />
      </mesh>

      {/* Label */}
      <Billboard position={[0, 1.8, 0]}>
        <Text
          fontSize={0.55}
          color={hovered ? '#ffffff' : '#aaaaaa'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          {module.name}
        </Text>
      </Billboard>
    </group>
  );
}
