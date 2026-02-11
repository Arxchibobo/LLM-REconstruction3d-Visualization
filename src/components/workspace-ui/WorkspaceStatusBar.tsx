'use client';

import { Activity, Box, Layers } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';

export default function WorkspaceStatusBar() {
  const { sessions, modules } = useWorkspaceStore();

  const totalModulesPlaced = sessions.reduce((sum, s) => sum + s.moduleIds.length, 0);
  const draftingCount = sessions.filter((s) => s.status === 'drafting').length;
  const runningCount = sessions.filter((s) => s.status === 'running').length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;

  return (
    <footer
      className="
        fixed left-0 right-0 bottom-0 h-10 z-50
        bg-[#0F172A] border-t border-[#1E293B]
        shadow-lg shadow-[#00FFFF]/5
      "
    >
      <div className="h-full flex items-center justify-between px-6 text-xs font-mono">
        {/* Left: Stats */}
        <div className="flex items-center gap-6 text-gray-400">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#00FFFF]" />
            <span>Sessions: <span className="text-[#00FFFF]">{sessions.length}</span></span>
          </div>
          <div className="w-px h-3 bg-[#1E293B]" />
          <div className="flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-[#FF00FF]" />
            <span>Modules: <span className="text-[#FF00FF]">{totalModulesPlaced}</span></span>
          </div>
          <div className="w-px h-3 bg-[#1E293B]" />
          <span>Available: <span className="text-gray-300">{modules.length}</span></span>
        </div>

        {/* Right: Status breakdown */}
        <div className="flex items-center gap-4 text-gray-400">
          {draftingCount > 0 && (
            <span>Drafting: <span className="text-[#00FFFF]">{draftingCount}</span></span>
          )}
          {runningCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
              <span>Running: <span className="text-blue-400">{runningCount}</span></span>
            </div>
          )}
          {completedCount > 0 && (
            <span>Completed: <span className="text-green-400">{completedCount}</span></span>
          )}
          <div className="w-px h-3 bg-[#1E293B]" />
          <span className="text-gray-500">Workspace v1.0</span>
        </div>
      </div>
    </footer>
  );
}
