'use client';

import { DoubleSide } from 'three';

/**
 * Invisible ground plane for raycasting drop targets.
 * Also renders a subtle grid for spatial orientation.
 */
export default function GroundPlane() {
  return (
    <group>
      {/* Invisible raycast receiver */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        visible={false}
      >
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          side={DoubleSide}
        />
      </mesh>

      {/* Subtle grid for orientation */}
      <gridHelper
        args={[200, 40, '#1E293B', '#0F172A']}
        position={[0, -0.09, 0]}
      />
    </group>
  );
}
