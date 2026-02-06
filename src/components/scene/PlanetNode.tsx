'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Mesh, Group, Points, BufferGeometry, BufferAttribute, AdditiveBlending } from 'three';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
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
  const { selectedNode, setSelectedNode, hoveredNode, setHoveredNode, connections } = useKnowledgeStore();

  const isSelected = selectedNode?.id === node.id;
  const isHovered = hoveredNode?.id === node.id;

  // 🎯 计算是否与选中节点相关（直接连接）
  const isRelatedToSelected = useMemo(() => {
    if (!selectedNode) return false;
    if (isSelected) return true;

    // 检查是否有直接连接到选中节点
    return connections.some(conn =>
      (conn.source === selectedNode.id && conn.target === node.id) ||
      (conn.target === selectedNode.id && conn.source === node.id)
    );
  }, [selectedNode, node.id, connections, isSelected]);

  // 🎯 计算是否与hover节点相关
  const isRelatedToHovered = useMemo(() => {
    if (!hoveredNode) return false;
    if (isHovered) return true;

    return connections.some(conn =>
      (conn.source === hoveredNode.id && conn.target === node.id) ||
      (conn.target === hoveredNode.id && conn.source === node.id)
    );
  }, [hoveredNode, node.id, connections, isHovered]);

  // 🌑 聚焦模式：当有选中节点时，未相关的节点变暗
  const isDimmed = useMemo(() => {
    // 如果有选中节点，只有相关节点才亮
    if (selectedNode) {
      return !isRelatedToSelected;
    }
    // 如果有hover节点，只有相关节点才亮
    if (hoveredNode) {
      return !isRelatedToHovered;
    }
    return false;
  }, [selectedNode, hoveredNode, isRelatedToSelected, isRelatedToHovered]);

  // 🎨 获取语义颜色
  const colorScheme = getColorByType(node.type);

  // 📏 根据轨道和类型决定尺寸 (使用useMemo优化)
  const planetSize = useMemo(() => {
    if (node.type === 'category') return 1.8;
    if (node.type === 'skill' || node.type === 'mcp') return 1.2;
    return 0.8;
  }, [node.type]);

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
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (isHovered) {
      setHoverScale(1.15);
    } else {
      setHoverScale(1);
    }
  }, [isHovered]);

  // 🌊 点击脉冲动画 + 聚焦效果
  const clickSpring = useSpring({
    scale: clicked ? 1.4 : (isDimmed ? 0.8 : 1.0),
    opacity: clicked ? 1.0 : (isDimmed ? 0.15 : 0.7),
    emissiveIntensity: clicked ? 1.2 : (isDimmed ? 0.05 : (isHovered || isSelected ? 0.8 : 0.4)),
    config: { tension: 200, friction: 20 },
    onRest: () => setClicked(false),
  });

  // 🎪 点击处理
  const handleClick = (e: any) => {
    e.stopPropagation();

    // 触发点击动画
    setClicked(true);

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

  // 🎬 动画循环 (优化版 - 提前return减少不必要的计算)
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const shouldAnimate = isHovered || isSelected;

    // 极轻微悬浮 (仅非选中状态)
    if (groupRef.current && !isSelected) {
      groupRef.current.position.y =
        node.position[1] + Math.sin(time * 0.5 + node.position[0]) * 0.05;
    }

    // 如果不需要动画,直接返回
    if (!shouldAnimate) return;

    // 霓虹环旋转
    if (glowRingRef.current) {
      glowRingRef.current.rotation.z = time * 0.5;
    }

    // 粒子环绕 (简化条件检查)
    const particlesGeometry = particlesRef.current?.geometry;
    const positionAttr = particlesGeometry?.attributes?.position;
    if (!positionAttr) return;

    const positions = positionAttr.array as Float32Array;
    if (!positions?.length) return;

    // 更新粒子位置
    for (let i = 0; i < positions.length; i += 3) {
      const angle = time * 0.3 + i * 0.1;
      const radius = planetSize + 0.5 + Math.sin(time + i * 0.1) * 0.2;
      positions[i] = Math.cos(angle) * radius;
      positions[i + 1] = Math.sin(angle) * radius;
      positions[i + 2] = Math.sin(time * 0.5 + i * 0.05) * 0.5;
    }
    positionAttr.needsUpdate = true;
  });

  // 🧹 内存清理 (增强版 - 包括粒子几何体)
  useEffect(() => {
    return () => {
      // 清理主网格
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

      // 清理粒子几何体
      if (particlesRef.current && particlesRef.current.geometry) {
        particlesRef.current.geometry.dispose();
      }
    };
  }, []);

  // 🎨 决定几何体 - 根据 node.visual.shape (使用useMemo优化)
  const geometry = useMemo(() => {
    const shape = node.visual?.shape || 'sphere';

    // 渲染外壳 (主几何体)
    const renderShape = () => {
      switch (shape) {
        case 'sphere':
          return <sphereGeometry args={[planetSize, 32, 32]} />;
        case 'cube':
          return <boxGeometry args={[planetSize * 1.5, planetSize * 1.5, planetSize * 1.5]} />;
        case 'box':
          return <boxGeometry args={[planetSize * 1.5, planetSize * 1.5, planetSize * 1.5]} />;
        case 'cylinder':
          return <cylinderGeometry args={[planetSize, planetSize, planetSize * 2, 32]} />;
        case 'octahedron':
          return <octahedronGeometry args={[planetSize, 0]} />;
        case 'torus':
          return <torusGeometry args={[planetSize, planetSize * 0.4, 16, 100]} />;
        case 'dodecahedron':
          return <dodecahedronGeometry args={[planetSize, 0]} />;
        case 'icosahedron':
          return <icosahedronGeometry args={[planetSize, 0]} />;
        case 'cone':
          return <coneGeometry args={[planetSize, planetSize * 2, 32]} />;
        default:
          return <sphereGeometry args={[planetSize, 32, 32]} />;
      }
    };

    // 渲染内核 (发光核心)
    const renderCore = () => {
      const coreSize = planetSize * 0.7;
      switch (shape) {
        case 'sphere':
          return <sphereGeometry args={[coreSize, 32, 32]} />;
        case 'cube':
          return <boxGeometry args={[coreSize * 1.5, coreSize * 1.5, coreSize * 1.5]} />;
        case 'box':
          return <boxGeometry args={[coreSize * 1.5, coreSize * 1.5, coreSize * 1.5]} />;
        case 'cylinder':
          return <cylinderGeometry args={[coreSize, coreSize, coreSize * 2, 32]} />;
        case 'octahedron':
          return <octahedronGeometry args={[coreSize, 0]} />;
        case 'torus':
          return <torusGeometry args={[coreSize, coreSize * 0.4, 16, 100]} />;
        case 'dodecahedron':
          return <dodecahedronGeometry args={[coreSize, 0]} />;
        case 'icosahedron':
          return <icosahedronGeometry args={[coreSize, 0]} />;
        case 'cone':
          return <coneGeometry args={[coreSize, coreSize * 2, 32]} />;
        default:
          return <sphereGeometry args={[coreSize, 32, 32]} />;
      }
    };

    // Category 类型使用线框 + 交互
    if (node.type === 'category') {
      return (
        <>
          {/* 外框线 - 可交互 */}
          <animated.mesh
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            scale={clickSpring.scale}
          >
            {renderShape()}
            <animated.meshBasicMaterial
              color={colorScheme.primary}
              wireframe
              transparent
              opacity={clickSpring.opacity.to(v => isDimmed ? 0.08 : v)}
            />
          </animated.mesh>
          {/* 内核心 - 发光效果 */}
          <animated.mesh scale={clickSpring.scale}>
            {renderCore()}
            <animated.meshStandardMaterial
              color={colorScheme.primary}
              emissive={colorScheme.glow}
              emissiveIntensity={clickSpring.emissiveIntensity.to(v => v * 2)}
              transparent
              opacity={clickSpring.opacity.to(v => isDimmed ? 0.1 : 0.85)}
            />
          </animated.mesh>
        </>
      );
    }

    // 其他类型：实体 + 霓虹效果 + 点击动画
    return (
      <>
        {/* 半透明外壳 - 主要交互mesh（带动画） */}
        <animated.mesh
          ref={planetRef}
          castShadow
          receiveShadow
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          scale={clickSpring.scale}
        >
          {renderShape()}
          <animated.meshStandardMaterial
            color={colorScheme.primary}
            roughness={0.3}
            metalness={0.7}
            transparent
            opacity={clickSpring.opacity}
            emissive={colorScheme.glow}
            emissiveIntensity={clickSpring.emissiveIntensity}
          />
        </animated.mesh>

        {/* 内部发光核心 */}
        <mesh>
          {renderCore()}
          <meshStandardMaterial
            color={colorScheme.glow}
            emissive={colorScheme.glow}
            emissiveIntensity={isDimmed ? 0.2 : 2}
            transparent
            opacity={isDimmed ? 0.1 : 0.6}
          />
        </mesh>
      </>
    );
  }, [node.visual?.shape, node.type, planetSize, colorScheme, isDimmed, isHovered, handleClick, handlePointerOver, handlePointerOut]);

  return (
    <group
      ref={groupRef}
      position={node.position}
      scale={hoverScale}
    >
      {/* 星球本体 */}
      {geometry}

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
            <meshStandardMaterial
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
            <meshStandardMaterial
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
                <meshStandardMaterial
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
      {/* 聚焦模式下只显示选中/hover/相关节点的标签 */}
      {!isDimmed && (isHovered || isSelected || node.type === 'category' || isRelatedToSelected) && (
        <Text
          position={[0, planetSize + 1.2, 0]}
          fontSize={node.type === 'category' ? 0.7 : 0.6}
          color={node.type === 'category' ? '#00FFFF' : colorScheme.glow}
          anchorX="center"
          anchorY="bottom"
          font="/fonts/Orbitron-Bold.ttf"
          outlineWidth={0.1}
          outlineColor="#000000"
          maxWidth={10}
          textAlign="center"
        >
          {node.title.length > 25
            ? node.title.substring(0, 25) + '...'
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
