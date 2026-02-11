'use client';

import { Plus, ArrowLeft, Boxes } from 'lucide-react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';

interface WorkspaceTopBarProps {
  onCreateSession: () => void;
}

export default function WorkspaceTopBar({ onCreateSession }: WorkspaceTopBarProps) {
  const { sessions } = useWorkspaceStore();

  return (
    <header
      className="
        fixed top-0 left-0 right-0 h-16 z-50
        bg-[#0F172A]/95 backdrop-blur-md
        border-b border-[#1E293B]
        shadow-lg shadow-[#00FFFF]/5
      "
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* Left: Navigation */}
        <div className="flex items-center gap-4">
          <Link
            href="/v3"
            className="
              flex items-center gap-2 px-3 py-1.5
              text-sm text-gray-400
              hover:text-[#00FFFF] hover:bg-[#1E293B]
              rounded-lg transition-all
            "
          >
            <ArrowLeft className="w-4 h-4" />
            <span>3D Graph</span>
          </Link>

          <div className="w-px h-6 bg-[#1E293B]" />

          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#FF00FF]" />
            <h1 className="text-lg font-bold text-white font-mono tracking-wider">
              WORKSPACE
            </h1>
          </div>
        </div>

        {/* Center: Session count */}
        <div className="flex items-center gap-3 text-sm font-mono">
          <span className="text-gray-500">Sessions:</span>
          <span className="text-[#00FFFF] font-bold">{sessions.length}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCreateSession}
            className="
              flex items-center gap-2 px-4 py-2
              bg-[#00FFFF]/10 border border-[#00FFFF]/30
              text-[#00FFFF] text-sm font-medium font-mono
              rounded-lg
              hover:bg-[#00FFFF]/20 hover:border-[#00FFFF]/50
              transition-all
            "
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>
      </div>
    </header>
  );
}
