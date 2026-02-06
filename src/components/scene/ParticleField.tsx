'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CYBERPUNK_LAYER_COLORS } from '@/utils/colors';

/**
 * 赛博朋克风格粒子场
 * 特性：
 * - 三种颜色的粒子（青色、品红、橙色）
 * - 缓慢漂浮动画
 * - 随机分布在球形空间内
 */
export default function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null);

  // 生成粒子位置和颜色
  const particlesData = useMemo(() => {
    const count = 1000; // 粒子数量
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // 三种霓虹色
    const colorPalette = [
      new THREE.Color(CYBERPUNK_LAYER_COLORS.coreLayer.primary),    // 青色
      new THREE.Color(CYBERPUNK_LAYER_COLORS.toolLayer.primary),    // 品红
      new THREE.Color(CYBERPUNK_LAYER_COLORS.resourceLayer.primary) // 橙色
    ];

    for (let i = 0; i < count; i++) {
      // 在球形空间内随机分布
      const radius = 30 + Math.random() * 20; // 半径 30-50
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // 随机选择颜色
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, []);

  // 缓慢旋转动画
  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.elapsedTime;
      particlesRef.current.rotation.y = time * 0.02; // 非常缓慢的旋转
      particlesRef.current.rotation.x = Math.sin(time * 0.01) * 0.1; // 轻微的上下摆动
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesData.positions.length / 3}
          array={particlesData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particlesData.colors.length / 3}
          array={particlesData.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending} // 霓虹发光效果
      />
    </points>
  );
}
