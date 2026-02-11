'use client';

import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import SessionZone from './SessionZone';
import ModuleNode from './ModuleNode';
import SessionConnections from './SessionConnections';
import { getModulePosition } from '@/utils/workspaceLayout';

/**
 * Renders all sessions and their modules in 3D space.
 */
export default function WorkspaceGraph() {
  const {
    sessions,
    selectedSessionId,
    setSelectedSession,
    modules,
    dragState,
  } = useWorkspaceStore();

  return (
    <group>
      {sessions.map((session) => {
        const sessionModules = session.moduleIds
          .map((id) => modules.find((m) => m.id === id))
          .filter((m): m is NonNullable<typeof m> => m !== undefined);

        const isSelected = selectedSessionId === session.id;
        const isDropTarget = dragState.dropTarget === session.id;

        return (
          <SessionZone
            key={session.id}
            session={session}
            isSelected={isSelected}
            isDropTarget={isDropTarget}
            onClick={() => setSelectedSession(session.id)}
          >
            {/* Module nodes inside this session */}
            {sessionModules.map((module, index) => {
              const localPos = getModulePosition(
                sessionModules.length,
                index,
                [0, 0, 0] // Relative to session group
              );

              return (
                <ModuleNode
                  key={module.id}
                  module={module}
                  position={localPos}
                />
              );
            })}

            {/* Connection lines between modules */}
            <SessionConnections
              modules={sessionModules}
              sessionCenter={[0, 0, 0]}
            />
          </SessionZone>
        );
      })}
    </group>
  );
}
