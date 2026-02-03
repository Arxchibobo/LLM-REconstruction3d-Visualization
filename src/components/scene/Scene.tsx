'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense } from 'react';
import KnowledgeGraph from './KnowledgeGraph';
import SpaceBackground from './SpaceBackground';
import Camera from './Camera';
import CameraController from './CameraController';
import LoadingScreen from '../ui/LoadingScreen';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';

export default function Scene() {
  const { loading, nodes } = useKnowledgeStore();

  // 显示Loading状态
  if (loading) {
    return <LoadingScreen />;
  }

  // 显示提示信息（如果没有数据）
  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/90">
        <div className="text-cyan-400 text-xl font-mono mb-4">系统初始化中...</div>
        <div className="text-cyan-400/60 text-sm font-mono">正在加载Claude配置</div>
        <div className="mt-8 text-yellow-400/80 text-xs font-mono max-w-md text-center">
          提示：如果长时间无内容显示，请检查控制台日志
        </div>
      </div>
    );
  }

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      camera={{ position: [0, 10, 20], fov: 75, near: 0.1, far: 1000 }}
      className="no-select"
      onCreated={({ gl }) => {
        // WebGL context lost/restored事件处理
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          console.warn('WebGL context lost, preventing default...');
          e.preventDefault();
        });
        gl.domElement.addEventListener('webglcontextrestored', () => {
          console.log('WebGL context restored');
        });
      }}
    >
      {/* 宇宙背景（包含星星、星云、光源） */}
      <SpaceBackground />

      {/* 相机控制 */}
      <Camera />

      {/* 相机控制器（UI 交互） */}
      <CameraController />

      {/* 轨道控制器 */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
      />

      {/* 知识图谱 */}
      <Suspense fallback={null}>
        <KnowledgeGraph />
      </Suspense>

      {/* 后处理效果 - Vaporwave 辉光 */}
      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
