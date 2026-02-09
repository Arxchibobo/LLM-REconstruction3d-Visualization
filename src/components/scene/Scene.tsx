'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Suspense, useRef } from 'react';
import { DoubleSide, HalfFloatType } from 'three';
import KnowledgeGraph from './KnowledgeGraph';
import SpaceBackground from './SpaceBackground';
import AttentionFlow from './AttentionFlow';
import LiveActivityOverlay from './LiveActivityOverlay';
import Camera from './Camera';
import CameraController from './CameraController';
import LoadingScreen from '../ui/LoadingScreen';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';

/**
 * FadeOverlay - Full-screen fade plane for mode transition animation
 * Renders at renderOrder 999 to be on top of everything
 * Opacity lerps 0→1 (fade out) when transitioning, 1→0 (fade in) when done
 */
function FadeOverlay() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { isTransitioning } = useKnowledgeStore();
  const opacityRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.MeshBasicMaterial;

    const target = isTransitioning ? 1 : 0;
    const speed = 4; // lerp speed
    opacityRef.current += (target - opacityRef.current) * Math.min(speed * delta, 1);

    material.opacity = opacityRef.current;
    meshRef.current.visible = opacityRef.current > 0.01;
  });

  return (
    <mesh ref={meshRef} renderOrder={999} visible={false}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial
        color="#030510"
        transparent
        opacity={0}
        side={DoubleSide}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function Scene() {
  const { loading, nodes, setSelectedNode, setHoveredNode, selectedNode } = useKnowledgeStore();

  // 🎯 点击空白处取消选中
  const handlePointerMissed = () => {
    setSelectedNode(null);
    setHoveredNode(null);
  };

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
      onPointerMissed={handlePointerMissed}
      onCreated={({ gl }) => {
        // WebGL context lost/restored事件处理
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
        });
        gl.domElement.addEventListener('webglcontextrestored', () => {
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
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
      />

      {/* 知识图谱 */}
      <Suspense fallback={null}>
        <KnowledgeGraph />
      </Suspense>

      {/* Claude 注意力流可视化 */}
      <AttentionFlow />

      {/* 实时活动叠加层 */}
      <LiveActivityOverlay />

      {/* 模式切换过渡遮罩 */}
      <FadeOverlay />

      {/* Post-processing with HalfFloatType to preserve color space */}
      <EffectComposer frameBufferType={HalfFloatType} multisampling={0}>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        <ToneMapping mode={ToneMappingMode.REINHARD} />
      </EffectComposer>
    </Canvas>
  );
}
