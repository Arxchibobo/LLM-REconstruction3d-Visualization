'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { NODE_TYPE_COLORS } from '@/types/knowledge';
import type { ModuleType } from '@/types/workspace';

const MODULE_TO_NODE: Record<ModuleType, string> = {
  skill: 'skill', mcp: 'mcp', plugin: 'plugin',
  hook: 'hook', rule: 'rule', agent: 'agent', memory: 'memory',
};

/**
 * Ghost module rendered at the drag world position during drag-and-drop.
 */
export default function DragPreview() {
  const { dragState } = useWorkspaceStore();
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2;
    }
  });

  if (!dragState.isDragging || !dragState.draggedModule || !dragState.worldPosition) {
    return null;
  }

  const module = dragState.draggedModule;
  const color = NODE_TYPE_COLORS[MODULE_TO_NODE[module.type] as keyof typeof NODE_TYPE_COLORS] || '#888888';
  const pos = dragState.worldPosition;

  return (
    <group position={[pos[0], pos[1] + 1, pos[2]]}>
      {/* Ghost sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Drop indicator ring on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <torusGeometry args={[1.5, 0.05, 8, 32]} />
        <meshBasicMaterial
          color={dragState.dropTarget ? '#FFFF00' : '#00FFFF'}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Label */}
      <Billboard position={[0, 1.2, 0]}>
        <Text
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {module.name}
        </Text>
      </Billboard>
    </group>
  );
}
