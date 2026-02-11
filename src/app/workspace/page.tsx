'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WorkspaceTopBar from '@/components/workspace-ui/WorkspaceTopBar';
import ModulePalette from '@/components/workspace-ui/ModulePalette';
import SessionPanel from '@/components/workspace-ui/SessionPanel';
import WorkspaceStatusBar from '@/components/workspace-ui/WorkspaceStatusBar';
import CreateSessionDialog from '@/components/workspace-ui/CreateSessionDialog';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { screenToWorld, findNearestSession } from '@/utils/workspaceRaycast';

// Dynamic import for 3D scene (no SSR)
const WorkspaceScene3D = dynamic(
  () => import('@/components/workspace-scene/WorkspaceScene'),
  { ssr: false }
);

export default function WorkspacePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const {
    loadModules,
    sessions,
    dragState,
    cameraRef,
    updateDragWorldPosition,
    setDropTarget,
    executeDrop,
    endDrag,
    setCanvasRect,
    paletteOpen,
  } = useWorkspaceStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingModuleId, setPendingModuleId] = useState<string | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Auth guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Load modules on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadModules();
    }
  }, [isAuthenticated]);

  // Keep canvas rect synced
  useEffect(() => {
    const updateRect = () => {
      if (canvasContainerRef.current) {
        setCanvasRect(canvasContainerRef.current.getBoundingClientRect());
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [paletteOpen]);

  // === Drag-and-drop handlers (HTML → 3D bridge) ===

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    if (!cameraRef || !canvasContainerRef.current) return;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    const worldPos = screenToWorld(e.clientX, e.clientY, rect, cameraRef);

    if (worldPos) {
      updateDragWorldPosition(worldPos);
      const nearestSession = findNearestSession(worldPos, sessions);
      setDropTarget(nearestSession);
    }
  }, [cameraRef, sessions, updateDragWorldPosition, setDropTarget]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    const dragData = e.dataTransfer.getData('text/plain');
    let moduleIds: string[];

    // Check if it's batch selection (JSON array) or single module
    try {
      const parsed = JSON.parse(dragData);
      moduleIds = Array.isArray(parsed) ? parsed : [dragData];
    } catch {
      moduleIds = [dragData];
    }

    const result = executeDrop();
    if (!result) return;

    if (result.action === 'added' && result.sessionId) {
      // Batch add remaining selected modules to the session
      const { addModuleToSession, selectedModules } = useWorkspaceStore.getState();
      if (moduleIds.length > 1) {
        moduleIds.forEach((moduleId) => {
          if (moduleId !== dragState.draggedModule?.id) {
            addModuleToSession(result.sessionId!, moduleId);
          }
        });
      }
    } else if (result.action === 'new-session') {
      // Store all module ids for the new session
      setPendingModuleId(moduleIds.length > 1 ? JSON.stringify(moduleIds) : moduleIds[0]);
      setDialogOpen(true);
    }
  }, [executeDrop, dragState]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only trigger when actually leaving the canvas container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDropTarget(null);
  }, [setDropTarget]);

  const handleCreateSession = () => {
    setPendingModuleId(null);
    setDialogOpen(true);
  };

  // Handle double-click on empty space to create session
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    // Only trigger if not clicking on a session or module
    const target = e.target as HTMLElement;
    if (target.tagName === 'CANVAS' || target.classList.contains('relative')) {
      handleCreateSession();
    }
  }, []);

  // Don't render until auth check completes
  if (!isAuthenticated) {
    return (
      <div className="w-screen h-screen bg-[#0A1929] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A1929]">
      {/* Top bar */}
      <WorkspaceTopBar onCreateSession={handleCreateSession} />

      {/* Left: Module palette */}
      <ModulePalette />

      {/* Right: Session detail panel */}
      <SessionPanel />

      {/* Main: 3D Canvas */}
      <main
        className={`
          absolute top-16 bottom-10 right-0 overflow-hidden
          ${paletteOpen ? 'left-60' : 'left-0'}
          transition-all duration-200
        `}
      >
        <div
          ref={canvasContainerRef}
          className="relative w-full h-full"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onDoubleClick={handleCanvasDoubleClick}
        >
          <WorkspaceScene3D />

          {/* Drop zone indicator when dragging over empty space */}
          {dragState.isDragging && !dragState.dropTarget && (
            <div className="
              absolute inset-0 pointer-events-none
              border-2 border-dashed border-[#00FFFF]/20
              rounded-lg m-4
              flex items-center justify-center
            ">
              <div className="
                px-6 py-3 rounded-xl
                bg-[#0F172A]/80 border border-[#00FFFF]/30
                text-[#00FFFF] text-sm font-mono
              ">
                Drop to create new session
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom: Status bar */}
      <WorkspaceStatusBar />

      {/* Create Session Dialog */}
      <CreateSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pendingModuleId={pendingModuleId}
      />
    </div>
  );
}
