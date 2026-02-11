'use client';

import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { HalfFloatType } from 'three';
import SpaceBackground from '../scene/SpaceBackground';
import WorkspaceGraph from './WorkspaceGraph';
import GroundPlane from './GroundPlane';
import DragPreview from './DragPreview';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';

/**
 * Syncs the R3F camera reference into Zustand for use by HTML drag handlers.
 */
function CameraSync() {
  const { camera } = useThree();
  const { setCameraRef } = useWorkspaceStore();

  useEffect(() => {
    setCameraRef(camera);
    return () => setCameraRef(null);
  }, [camera, setCameraRef]);

  return null;
}

export default function WorkspaceScene() {
  const { dragState, setSelectedSession } = useWorkspaceStore();

  const handlePointerMissed = () => {
    setSelectedSession(null);
  };

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      camera={{ position: [0, 40, 50], fov: 60, near: 0.1, far: 1000 }}
      className="no-select"
      onPointerMissed={handlePointerMissed}
    >
      {/* Space background */}
      <SpaceBackground />

      {/* Sync camera ref to store */}
      <CameraSync />

      {/* Orbit controls - disabled during drag */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={200}
        maxPolarAngle={Math.PI / 2.2}
        enabled={!dragState.isDragging}
      />

      {/* Ambient + directional light */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[20, 30, 10]} intensity={0.5} />

      {/* Ground plane (raycast + grid) */}
      <GroundPlane />

      {/* Sessions and modules */}
      <Suspense fallback={null}>
        <WorkspaceGraph />
      </Suspense>

      {/* Drag ghost preview */}
      <DragPreview />

      {/* Post-processing */}
      <EffectComposer frameBufferType={HalfFloatType} multisampling={0}>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        <ToneMapping mode={ToneMappingMode.REINHARD} />
      </EffectComposer>
    </Canvas>
  );
}
