'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Points, BufferGeometry, PointsMaterial, BufferAttribute, AdditiveBlending } from 'three';

export default function CenterRobot() {
  const robotRef = useRef<Group>(null);
  const outerRingRef = useRef<Group>(null);
  const middleRingRef = useRef<Group>(null);
  const particlesRef = useRef<Points>(null);

  // 🌌 创建数据流粒子系统
  const particles = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 2 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));

    return geometry;
  }, []);

  // 🎬 动画循环
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // 🫁 核心呼吸效果
    if (robotRef.current) {
      const breathScale = 1 + Math.sin(time * 0.8) * 0.05;
      robotRef.current.scale.setScalar(breathScale);
      robotRef.current.position.y = Math.sin(time * 0.5) * 0.2;
    }

    // 🔄 外圈旋转
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = time * 0.3;
    }

    // 🔄 中圈反向旋转
    if (middleRingRef.current) {
      middleRingRef.current.rotation.z = -time * 0.5;
    }

    // ✨ 粒子流动
    if (
      particlesRef.current &&
      particlesRef.current.geometry &&
      particlesRef.current.geometry.attributes &&
      particlesRef.current.geometry.attributes.position
    ) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      if (positions && positions.length > 0) {
        for (let i = 0; i < positions.length; i += 3) {
          // 螺旋运动
          const angle = time * 0.5 + i * 0.01;
          const radius = 2 + Math.sin(time + i * 0.1) * 0.5;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 1] = Math.sin(angle) * radius;
          positions[i + 2] = Math.sin(time * 0.3 + i * 0.05) * 2;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={robotRef} position={[0, 0, 0]}>
      {/* 🤖 核心球体 - Cyberpunk 风格 */}
      <mesh castShadow>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color="#0A0E27"
          metalness={0.9}
          roughness={0.1}
          emissive="#00FFFF"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* 🔮 内部发光核心 */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00FFFF"
          emissiveIntensity={2}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* 🌟 能量脉冲点 - 眼睛 */}
      <mesh position={[-0.4, 0.3, 1.0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#FF00FF"
          emissive="#FF00FF"
          emissiveIntensity={3}
        />
      </mesh>
      <mesh position={[0.4, 0.3, 1.0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#FF00FF"
          emissive="#FF00FF"
          emissiveIntensity={3}
        />
      </mesh>

      {/* 🔷 外层旋转框架 - Cyberpunk 棱角 */}
      <group ref={outerRingRef}>
        {/* 八边形框架 */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = Math.cos(angle) * 2.5;
          const y = Math.sin(angle) * 2.5;
          return (
            <mesh key={i} position={[x, y, 0]} rotation={[0, 0, angle]}>
              <boxGeometry args={[0.8, 0.1, 0.1]} />
              <meshStandardMaterial
                color="#00FFFF"
                emissive="#00FFFF"
                emissiveIntensity={1.5}
                transparent
                opacity={0.8}
              />
            </mesh>
          );
        })}
      </group>

      {/* 💫 中层旋转环 - Magenta */}
      <group ref={middleRingRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.0, 0.08, 16, 100]} />
          <meshStandardMaterial
            color="#FF00FF"
            emissive="#FF00FF"
            emissiveIntensity={1.2}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* 环上的能量节点 */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i / 4) * Math.PI * 2;
          const x = Math.cos(angle) * 2.0;
          const z = Math.sin(angle) * 2.0;
          return (
            <mesh key={i} position={[x, 0, z]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial
                color="#FFFF00"
                emissive="#FFFF00"
                emissiveIntensity={2}
              />
            </mesh>
          );
        })}
      </group>

      {/* 🌊 底部全息投影圈 */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2.5, 64]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00FFFF"
          emissiveIntensity={1}
          transparent
          opacity={0.4}
          side={2}
        />
      </mesh>

      {/* ✨ 数据流粒子系统 */}
      <points ref={particlesRef} geometry={particles}>
        <pointsMaterial
          color="#00FFFF"
          size={0.08}
          transparent
          opacity={0.8}
          blending={AdditiveBlending}
          sizeAttenuation={true}
        />
      </points>

      {/* 🔺 顶部信号发射器 */}
      <mesh position={[0, 2, 0]}>
        <coneGeometry args={[0.3, 0.8, 4]} />
        <meshStandardMaterial
          color="#00FFFF"
          emissive="#00FFFF"
          emissiveIntensity={2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* 🎯 4个悬浮能量核心 */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const radius = 1.8;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh>
              <octahedronGeometry args={[0.15]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
                emissive={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
                emissiveIntensity={1.5}
                transparent
                opacity={0.9}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
