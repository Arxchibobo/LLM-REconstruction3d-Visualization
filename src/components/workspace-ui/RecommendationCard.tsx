'use client';

import { Plus, Sparkles } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import type { ModuleRecommendation } from '@/types/workspace';

interface RecommendationCardProps {
  rec: ModuleRecommendation;
  sessionId: string;
}

export default function RecommendationCard({ rec, sessionId }: RecommendationCardProps) {
  const { modules, addModuleToSession } = useWorkspaceStore();
  const module = modules.find((m) => m.id === rec.moduleId);
  if (!module) return null;

  const scorePercent = Math.round(rec.score * 100);

  return (
    <div className="
      flex items-center gap-2 px-3 py-2
      bg-[#1E293B]/30 border border-[#2D3B4F]/50
      rounded-lg
    ">
      <Sparkles className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-200 truncate">{module.name}</span>
          <span className="text-[10px] text-yellow-400/70 font-mono">{scorePercent}%</span>
        </div>
        <div className="text-[10px] text-gray-500 truncate">{rec.reason}</div>
      </div>
      <button
        onClick={() => addModuleToSession(sessionId, module.id)}
        className="
          p-1 text-gray-500 hover:text-[#00FFFF]
          hover:bg-[#00FFFF]/10 rounded
          transition-colors flex-shrink-0
        "
        title="添加到 Session"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
