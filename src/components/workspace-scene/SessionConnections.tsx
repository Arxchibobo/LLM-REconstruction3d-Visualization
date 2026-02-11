'use client';

import { QuadraticBezierLine } from '@react-three/drei';
import type { WorkspaceModule } from '@/types/workspace';
import { getModulePosition } from '@/utils/workspaceLayout';

interface SessionConnectionsProps {
  modules: WorkspaceModule[];
  sessionCenter: [number, number, number];
}

export default function SessionConnections({ modules, sessionCenter }: SessionConnectionsProps) {
  if (modules.length < 2) return null;

  const centerY = sessionCenter[1] + 0.8;
  const center: [number, number, number] = [sessionCenter[0], centerY, sessionCenter[2]];

  return (
    <group>
      {modules.map((module, index) => {
        const pos = getModulePosition(modules.length, index, sessionCenter);
        const midY = centerY + 1.5;

        return (
          <QuadraticBezierLine
            key={module.id}
            start={pos}
            end={center}
            mid={[
              (pos[0] + center[0]) / 2,
              midY,
              (pos[2] + center[2]) / 2,
            ]}
            lineWidth={1}
            color={`#ffffff`}
            transparent
            opacity={0.08}
          />
        );
      })}
    </group>
  );
}
