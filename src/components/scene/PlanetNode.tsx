'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Mesh, Group, Points, BufferGeometry, BufferAttribute, AdditiveBlending } from 'three';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { KnowledgeNode } from '@/types/knowledge';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import { getColorByType } from '@/utils/colors';

interface PlanetNodeProps {
  node: KnowledgeNode;
}

export default function PlanetNode({ node }: PlanetNodeProps) {
  const groupRef = useRef<Group>(null);
  const planetRef = useRef<Mesh>(null);
  const glowRingRef = useRef<Mesh>(null);
  const particlesRef = useRef<Points>(null);
  const { selectedNode, setSelectedNode, hoveredNode, setHoveredNode } = useKnowledgeStore();

  const isSelected = selectedNode?.id === node.id;
  const isHovered = hoveredNode?.id === node.id;
  const isDimmed = hoveredNode !== null && !isSelected && !isHovered;

  // 🎨 获取语义颜色
  const colorScheme = getColorByType(node.type);

  // 📏 根据轨道和类型决定尺寸
  const getSize = () => {
    if (node.type === 'category') return 1.8;
    if (node.type === 'skill' || node.type === 'mcp') return 1.2;
    return 0.8;
  };

  const planetSize = getSize();

  // 🌌 创建节点周围的数据粒子
  const particles = useMemo(() => {
    if (node.type === 'category') return null; // Category 节点不需要粒子

    const count = 30;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = planetSize + 0.5 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return geometry;
  }, [node.type, planetSize]);

  // 🎭 Hover 状态管理
  const [hoverScale, setHoverScale] = useState(1);

  useEffect(() => {
    if (isHovered) {
      setHoverScale(1.15);
    } else {
      setHoverScale(1);
    }
  }, [isHovered]);

  // 🎪 点击处理
  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedNode(isSelected ? null : node);
  };

  // 🎪 Hover 处理
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHoveredNode(node);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHoveredNode(null);
    document.body.style.cursor = 'auto';
  };

  // 🎬 动画循环
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // 极轻微悬浮
    if (groupRef.current && !isSelected) {
      groupRef.current.position.y =
        node.position[1] + Math.sin(time * 0.5 + node.position[0]) * 0.05;
    }

    // 霓虹环旋转
    if (glowRingRef.current && (isHovered || isSelected)) {
      glowRingRef.current.rotation.z = time * 0.5;
    }

    // 粒子环绕
    if (
      particlesRef.current &&
      particlesRef.current.geometry &&
      particlesRef.current.geometry.attributes &&
      particlesRef.current.geometry.attributes.position &&
      (isHovered || isSelected)
    ) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      if (positions && positions.length > 0) {
        for (let i = 0; i < positions.length; i += 3) {
          const angle = time * 0.3 + i * 0.1;
          const radius = planetSize + 0.5 + Math.sin(time + i * 0.1) * 0.2;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 1] = Math.sin(angle) * radius;
          positions[i + 2] = Math.sin(time * 0.5 + i * 0.05) * 0.5;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  // 🧹 内存清理
  useEffect(() => {
    return () => {
      if (planetRef.current) {
        const mesh = planetRef.current;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    };
  }, []);

  // 🎨 决定几何体
  const getGeometry = () => {
    if (node.type === 'category') {
      // Category 使用八面体框架
      return (
        <>
          {/* 外框线 */}
          <mesh>
            <octahedronGeometry args={[planetSize, 0]} />
            <meshBasicMaterial
              color={colorScheme.primary}
              wireframe
              transparent
              opacity={0.6}
            />
          </mesh>
          {/* 内核心 */}
          <mesh>
            <octahedronGeometry args={[planetSize * 0.6, 0]} />
            <meshStandardMaterial
              color={colorScheme.primary}
              emissive={colorScheme.glow}
              emissiveIntensity={1.5}
              transparent
              opacity={0.8}
            />
          </mesh>
        </>
      );
    }

    // 其他类型：球体 + 霓虹效果
    return (
      <>
        {/* 半透明外壳 */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[planetSize, 32, 32]} />
          <meshStandardMaterial
            color={colorScheme.primary}
            roughness={0.3}
            metalness={0.7}
            transparent
            opacity={isDimmed ? 0.3 : 0.7}
            emissive={colorScheme.glow}
            emissiveIntensity={isHovered ? 0.8 : 0.4}
          />
        </mesh>

        {/* 内部发光核心 */}
        <mesh>
          <sphereGeometry args={[planetSize * 0.7, 32, 32]} />
          <meshStandardMaterial
            color={colorScheme.glow}
            emissive={colorScheme.glow}
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      </>
    );
  };

  return (
    <group
      ref={groupRef}
      position={node.position}
      scale={hoverScale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* 星球本体 */}
      <group ref={planetRef}>
        {getGeometry()}
      </group>

      {/* 霓虹边缘环 - 只在 Hover/Selected 时显示 */}
      {(isHovered || isSelected) && (
        <mesh ref={glowRingRef} rotation={[0, 0, 0]}>
          <torusGeometry args={[planetSize * 1.2, 0.05, 16, 100]} />
          <meshBasicMaterial
            color={node.type === 'category' ? '#00FFFF' : colorScheme.glow}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* 选中效果 - 双重圆环 + 扫描线 */}
      {isSelected && (
        <>
          {/* 外环 - Cyan */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[planetSize * 1.4, 0.08, 16, 64]} />
            <meshBasicMaterial
              color="#00FFFF"
              emissive="#00FFFF"
              emissiveIntensity={1.5}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* 内环 - Magenta */}
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <torusGeometry args={[planetSize * 1.3, 0.06, 16, 64]} />
            <meshBasicMaterial
              color="#FF00FF"
              emissive="#FF00FF"
              emissiveIntensity={1.2}
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* 4个角标 */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            const radius = planetSize * 1.6;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            return (
              <mesh key={i} position={[x, 0, z]}>
                <boxGeometry args={[0.15, 0.15, 0.15]} />
                <meshBasicMaterial
                  color="#FFFF00"
                  emissive="#FFFF00"
                  emissiveIntensity={2}
                />
              </mesh>
            );
          })}
        </>
      )}

      {/* 数据粒子流 - Hover/Selected 时显示 */}
      {particles && (isHovered || isSelected) && (
        <points ref={particlesRef} geometry={particles}>
          <pointsMaterial
            size={0.05}
            color={colorScheme.glow}
            transparent
            opacity={0.7}
            blending={AdditiveBlending}
            sizeAttenuation={true}
          />
        </points>
      )}

      {/* 文字标签 - Cyberpunk 风格 */}
      {(isHovered || isSelected) && (
        <Text
          position={[0, planetSize + 1.2, 0]}
          fontSize={0.6}
          color={node.type === 'category' ? '#00FFFF' : colorScheme.glow}
          anchorX="center"
          anchorY="bottom"
          font="/fonts/Orbitron-Bold.ttf"
          outlineWidth={0.08}
          outlineColor="#000000"
          maxWidth={8}
          textAlign="center"
        >
          {node.title.length > 30
            ? node.title.substring(0, 30) + '...'
            : node.title}
        </Text>
      )}

      {/* 类型标签 - 小字 */}
      {isSelected && (
        <Text
          position={[0, planetSize + 0.6, 0]}
          fontSize={0.3}
          color="#00D9FF"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          [{node.type.toUpperCase()}]
        </Text>
      )}
    </group>
  );
}
