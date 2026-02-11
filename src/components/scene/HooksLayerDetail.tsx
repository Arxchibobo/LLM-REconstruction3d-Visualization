'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { getTranslation } from '@/i18n/translations';

interface HooksLayerDetailProps {
  layoutPosition?: [number, number, number];
}

/**
 * HooksLayerDetail - Shows hook architecture when category-hooks is selected/hovered.
 * Displays 3 hook types (PreToolUse, PostToolUse, Stop) in triangular layout
 * with flow particles and dashed connections.
 */
export default function HooksLayerDetail({ layoutPosition }: HooksLayerDetailProps) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const { selectedNode, hoveredNode } = useKnowledgeStore();
  const { language } = useLanguageStore();

  // Translation helper
  const t = (key: string) => getTranslation(language, key);

  const isVisible =
    selectedNode?.id === 'category-hooks' || hoveredNode?.id === 'category-hooks';

  const centerPos = useMemo<[number, number, number]>(
    () => layoutPosition || [0, 0, 0],
    [layoutPosition]
  );

  // Three hook types arranged in a triangle around the center
  // Increased offsets to prevent text overlap
  const hookTypes = useMemo(
    () => [
      {
        id: 'pre-tool-use',
        label: t('v3.scene.preToolUse'),
        description: t('v3.scene.preToolUseDesc'),
        color: '#00FFFF',
        offset: [0, 3.5, 0] as [number, number, number],
      },
      {
        id: 'post-tool-use',
        label: t('v3.scene.postToolUse'),
        description: t('v3.scene.postToolUseDesc'),
        color: '#FF00FF',
        offset: [-3.0, -1.8, 0] as [number, number, number],
      },
      {
        id: 'stop',
        label: t('v3.scene.stop'),
        description: t('v3.scene.stopDesc'),
        color: '#FFA500',
        offset: [3.0, -1.8, 0] as [number, number, number],
      },
    ],
    [language]
  );

  // Flow particles along connections
  const particlePositions = useMemo(() => {
    const count = 30;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    return positions;
  }, []);

  // Animate particles
  useFrame((state) => {
    if (!particlesRef.current || !isVisible) return;
    const time = state.clock.elapsedTime;
    const positions = particlesRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < positions.length / 3; i++) {
      const idx = i * 3;
      // Circular flow
      const angle = time * 0.5 + (i / (positions.length / 3)) * Math.PI * 2;
      const radius = 1.5 + Math.sin(time + i) * 0.5;
      positions[idx] = Math.cos(angle) * radius;
      positions[idx + 1] = Math.sin(angle) * radius;
      positions[idx + 2] = Math.sin(time * 0.3 + i) * 0.2;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!isVisible) return null;

  return (
    <group
      ref={groupRef}
      position={[centerPos[0], centerPos[1] + 8, centerPos[2]]}
      renderOrder={999}
    >
      {/* Hook type nodes */}
      {hookTypes.map((hook) => (
        <group key={hook.id} position={hook.offset}>
          {/* Node sphere */}
          <mesh>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial
              color={hook.color}
              emissive={hook.color}
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* Glow */}
          <mesh>
            <sphereGeometry args={[0.55, 16, 16]} />
            <meshBasicMaterial
              color={hook.color}
              transparent
              opacity={0.15}
              side={THREE.BackSide}
            />
          </mesh>

          {/* Label */}
          <Billboard>
            <Text
              position={[0, 1.1, 0]}
              fontSize={0.4}
              color={hook.color}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.06}
              outlineColor="#000000"
              font="/fonts/inter-bold.woff"
            >
              {hook.label}
            </Text>
            <Text
              position={[0, 0.6, 0]}
              fontSize={0.22}
              color="#CCCCCC"
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.03}
              outlineColor="#000000"
            >
              {hook.description}
            </Text>
          </Billboard>

          {/* Dashed connection line back to center */}
          <Line
            points={[
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(-hook.offset[0], -hook.offset[1], -hook.offset[2]),
            ]}
            color={hook.color}
            lineWidth={1}
            dashed
            dashSize={0.3}
            gapSize={0.2}
            transparent
            opacity={0.5}
          />
        </group>
      ))}

      {/* Flow particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePositions.length / 3}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00FFFF"
          size={0.08}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Center label */}
      <Billboard>
        <Text
          position={[0, -3.5, 0]}
          fontSize={0.3}
          color="#EF4444"
          anchorX="center"
          anchorY="top"
          outlineWidth={0.04}
          outlineColor="#000000"
          font="/fonts/inter-bold.woff"
        >
          {t('v3.scene.hooksArchitecture')}
        </Text>
      </Billboard>
    </group>
  );
}
