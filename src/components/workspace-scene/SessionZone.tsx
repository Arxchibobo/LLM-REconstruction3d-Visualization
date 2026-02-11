'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
// DoubleSide removed — solid platform no longer needed
import type { Session, SessionStatus } from '@/types/workspace';
import { SESSION_ZONE_RADIUS } from '@/utils/workspaceLayout';

const STATUS_COLORS: Record<SessionStatus, string> = {
  drafting: '#00FFFF',
  ready: '#10B981',
  running: '#3B82F6',
  completed: '#F59E0B',
  failed: '#EF4444',
};

interface SessionZoneProps {
  session: Session;
  isSelected: boolean;
  isDropTarget: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

export default function SessionZone({
  session,
  isSelected,
  isDropTarget,
  onClick,
  children,
}: SessionZoneProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const borderColor = isDropTarget ? '#FFFF00' : (isSelected ? session.color : STATUS_COLORS[session.status]);

  // Ring rotation animation
  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.15;
    }
  });

  // Spring for selection/hover
  const { scale, ringOpacity } = useSpring({
    scale: isSelected ? 1.05 : hovered ? 1.02 : 1.0,
    ringOpacity: isSelected ? 0.9 : isDropTarget ? 0.8 : hovered ? 0.6 : 0.4,
    config: { tension: 200, friction: 20 },
  });

  // Module count badge
  const moduleCount = session.moduleIds.length;

  return (
    <animated.group
      position={session.position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Border ring (line-only, no solid fill) */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[SESSION_ZONE_RADIUS, 0.12, 8, 64]} />
        <animated.meshBasicMaterial
          color={borderColor}
          transparent
          opacity={ringOpacity}
        />
      </mesh>

      {/* Inner glow ring (drop target indicator) */}
      {isDropTarget && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <torusGeometry args={[SESSION_ZONE_RADIUS - 1, 0.3, 8, 64]} />
          <meshBasicMaterial
            color="#FFFF00"
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Session title label */}
      <Html
        position={[0, 0.5, -SESSION_ZONE_RADIUS - 1]}
        center
        distanceFactor={30}
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-center whitespace-nowrap select-none">
          <div
            className="text-sm font-bold font-mono tracking-wider px-3 py-1 rounded-full"
            style={{
              color: session.color,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: `1px solid ${session.color}40`,
              textShadow: `0 0 10px ${session.color}60`,
            }}
          >
            {session.name}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-1">
            {moduleCount} module{moduleCount !== 1 ? 's' : ''} · {session.status}
          </div>
        </div>
      </Html>

      {/* Module nodes rendered as children */}
      {children}
    </animated.group>
  );
}
