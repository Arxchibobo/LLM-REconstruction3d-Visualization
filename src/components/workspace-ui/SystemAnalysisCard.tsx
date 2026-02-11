'use client';

import { Plus, ArrowRight, Lightbulb, Info } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import type { SessionAnalysis, SuggestedAction } from '@/types/workspace';
import RecommendationCard from './RecommendationCard';

interface SystemAnalysisCardProps {
  analysis: SessionAnalysis;
  sessionId: string;
}

const ACTION_ICONS: Record<SuggestedAction['type'], React.ElementType> = {
  'add-modules': Plus,
  'change-status': ArrowRight,
  'refine-requirement': Lightbulb,
  'info': Info,
};

const ACTION_COLORS: Record<SuggestedAction['type'], string> = {
  'add-modules': '#00FFFF',
  'change-status': '#10B981',
  'refine-requirement': '#F59E0B',
  'info': '#8B5CF6',
};

export default function SystemAnalysisCard({ analysis, sessionId }: SystemAnalysisCardProps) {
  const applyAction = useWorkspaceStore((s) => s.applyAction);

  return (
    <div className="mt-2 space-y-3">
      {/* Intent pills */}
      {analysis.detectedIntents.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {analysis.detectedIntents.map((intent) => (
            <span
              key={intent}
              className="
                px-2 py-0.5 text-[10px] font-mono
                bg-[#00FFFF]/10 border border-[#00FFFF]/30
                text-[#00FFFF] rounded-full
              "
            >
              {intent}
            </span>
          ))}
        </div>
      )}

      {/* Recommended modules */}
      {analysis.recommendedModules.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500 font-mono">RECOMMENDED</span>
          {analysis.recommendedModules.slice(0, 3).map((rec) => (
            <RecommendationCard key={rec.moduleId} rec={rec} sessionId={sessionId} />
          ))}
        </div>
      )}

      {/* Action buttons */}
      {analysis.suggestedActions.length > 0 && (
        <div className="space-y-1.5">
          {analysis.suggestedActions.map((action, i) => {
            const Icon = ACTION_ICONS[action.type];
            const color = ACTION_COLORS[action.type];
            const isClickable = action.type === 'add-modules' || action.type === 'change-status';

            return (
              <button
                key={i}
                onClick={() => isClickable && applyAction(sessionId, action)}
                disabled={!isClickable}
                className={`
                  w-full flex items-start gap-2 px-2.5 py-2
                  rounded-md text-left text-xs
                  border transition-colors
                  ${isClickable
                    ? 'bg-[#0F172A]/60 border-[#2D3B4F] hover:border-opacity-80 cursor-pointer'
                    : 'bg-transparent border-[#2D3B4F]/50 cursor-default'
                  }
                `}
                style={isClickable ? { borderColor: `${color}30` } : undefined}
              >
                <Icon
                  className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                  style={{ color }}
                />
                <div className="min-w-0">
                  <div className="font-medium text-gray-200">{action.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{action.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
