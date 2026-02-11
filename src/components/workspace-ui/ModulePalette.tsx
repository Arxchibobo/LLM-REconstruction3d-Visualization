'use client';

import { useState } from 'react';
import {
  Search, ChevronDown, ChevronRight, GripVertical,
  Zap, Server, Puzzle, Anchor, BookOpen, Bot, Brain,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import type { ModuleType, WorkspaceModule } from '@/types/workspace';

const MODULE_TYPE_META: Record<ModuleType, { label: string; color: string; Icon: React.ElementType }> = {
  skill:  { label: 'Skills',  color: '#10B981', Icon: Zap },
  mcp:    { label: 'MCPs',    color: '#06B6D4', Icon: Server },
  plugin: { label: 'Plugins', color: '#F59E0B', Icon: Puzzle },
  hook:   { label: 'Hooks',   color: '#EF4444', Icon: Anchor },
  rule:   { label: 'Rules',   color: '#8B5CF6', Icon: BookOpen },
  agent:  { label: 'Agents',  color: '#EC4899', Icon: Bot },
  memory: { label: 'Memory',  color: '#14B8A6', Icon: Brain },
};

const MODULE_TYPES: ModuleType[] = ['skill', 'mcp', 'plugin', 'hook', 'rule', 'agent', 'memory'];

function ModuleCard({ module }: { module: WorkspaceModule }) {
  const { startDrag, endDrag, selectedModules, toggleModuleSelection } = useWorkspaceStore();
  const meta = MODULE_TYPE_META[module.type];
  const Icon = meta.Icon;
  const isSelected = selectedModules.has(module.id);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent drag start when clicking for selection
    e.stopPropagation();
    toggleModuleSelection(module.id, e.shiftKey || e.ctrlKey);
  };

  const handleDragStart = (e: React.DragEvent) => {
    // If dragging a selected module, include all selected modules
    if (isSelected) {
      e.dataTransfer.setData('text/plain', JSON.stringify(Array.from(selectedModules)));
    } else {
      e.dataTransfer.setData('text/plain', module.id);
    }
    e.dataTransfer.effectAllowed = 'copy';
    startDrag(module);
  };

  const handleDragEnd = () => {
    endDrag();
  };

  return (
    <div
      draggable
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        flex items-center gap-2 px-3 py-2
        rounded-lg cursor-grab active:cursor-grabbing
        transition-all group
        ${
          isSelected
            ? 'bg-[#00FFFF]/20 border-2 border-[#00FFFF]/60'
            : 'bg-[#1E293B]/50 border border-[#2D3B4F] hover:bg-[#1E293B] hover:border-[#3D4B5F]'
        }
      `}
    >
      <GripVertical className="w-3 h-3 text-gray-600 group-hover:text-gray-400 flex-shrink-0" />
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: meta.color }} />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-gray-200 truncate">{module.name}</div>
        {module.description && (
          <div className="text-[10px] text-gray-500 truncate">{module.description}</div>
        )}
      </div>
    </div>
  );
}

export default function ModulePalette() {
  const {
    paletteOpen, setPaletteOpen,
    paletteSearch, setPaletteSearch,
    paletteFilter, setPaletteFilter,
    getFilteredPaletteModules,
    modulesLoading,
    selectedModules,
    clearModuleSelection,
  } = useWorkspaceStore();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const filteredModules = getFilteredPaletteModules();

  // Group modules by type
  const grouped = MODULE_TYPES.reduce<Record<ModuleType, WorkspaceModule[]>>(
    (acc, type) => {
      acc[type] = filteredModules.filter((m) => m.type === type);
      return acc;
    },
    {} as Record<ModuleType, WorkspaceModule[]>
  );

  const toggleGroup = (type: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  if (!paletteOpen) {
    return (
      <button
        onClick={() => setPaletteOpen(true)}
        className="
          fixed left-0 top-20 z-40
          p-2 bg-[#0F172A] border border-[#1E293B]
          rounded-r-lg text-gray-400 hover:text-[#00FFFF]
          transition-colors
        "
      >
        <PanelLeftOpen className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside
      className="
        fixed left-0 top-16 bottom-10 w-60 z-40
        bg-[#0F172A]/95 backdrop-blur-md
        border-r border-[#1E293B]
        flex flex-col overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
        <h2 className="text-sm font-bold text-[#00FFFF] font-mono tracking-wider">
          MODULES
        </h2>
        <button
          onClick={() => setPaletteOpen(false)}
          className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[#1E293B]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="搜索模块..."
            value={paletteSearch}
            onChange={(e) => setPaletteSearch(e.target.value)}
            className="
              w-full pl-8 pr-3 py-1.5
              bg-[#1E293B] border border-[#2D3B4F]
              rounded-lg text-sm text-gray-200
              placeholder:text-gray-600
              focus:outline-none focus:border-[#00FFFF]/50
              transition-colors
            "
          />
        </div>
      </div>

      {/* Selection hint */}
      {selectedModules.size > 0 && (
        <div className="px-3 py-2 bg-[#00FFFF]/10 border-b border-[#00FFFF]/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#00FFFF]">
              {selectedModules.size} module{selectedModules.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearModuleSelection}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            Shift+Click to multi-select • Drag to batch add
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="px-3 py-2 border-b border-[#1E293B] flex flex-wrap gap-1">
        <button
          onClick={() => setPaletteFilter(null)}
          className={`
            px-2 py-0.5 text-[10px] font-mono rounded-full border transition-all
            ${paletteFilter === null
              ? 'bg-[#00FFFF]/20 border-[#00FFFF]/50 text-[#00FFFF]'
              : 'bg-transparent border-[#2D3B4F] text-gray-500 hover:text-gray-300'
            }
          `}
        >
          All
        </button>
        {MODULE_TYPES.map((type) => {
          const meta = MODULE_TYPE_META[type];
          const isActive = paletteFilter === type;
          return (
            <button
              key={type}
              onClick={() => setPaletteFilter(isActive ? null : type)}
              className={`
                px-2 py-0.5 text-[10px] font-mono rounded-full border transition-all
                ${isActive
                  ? 'bg-opacity-20 border-opacity-50'
                  : 'bg-transparent border-[#2D3B4F] text-gray-500 hover:text-gray-300'
                }
              `}
              style={isActive ? {
                backgroundColor: meta.color + '33',
                borderColor: meta.color + '80',
                color: meta.color,
              } : undefined}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {modulesLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-gray-500 font-mono animate-pulse">
              Loading modules...
            </div>
          </div>
        ) : (
          <div className="py-2">
            {MODULE_TYPES.map((type) => {
              const items = grouped[type];
              if (items.length === 0) return null;

              const meta = MODULE_TYPE_META[type];
              const Icon = meta.Icon;
              const isCollapsed = collapsedGroups.has(type);

              return (
                <div key={type} className="mb-1">
                  <button
                    onClick={() => toggleGroup(type)}
                    className="
                      w-full flex items-center gap-2 px-4 py-1.5
                      text-xs font-mono text-gray-400
                      hover:text-gray-200 hover:bg-[#1E293B]/50
                      transition-colors
                    "
                  >
                    {isCollapsed
                      ? <ChevronRight className="w-3 h-3" />
                      : <ChevronDown className="w-3 h-3" />
                    }
                    <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                    <span>{meta.label}</span>
                    <span className="ml-auto text-gray-600">({items.length})</span>
                  </button>

                  {!isCollapsed && (
                    <div className="px-3 space-y-1 mt-1">
                      {items.map((module) => (
                        <ModuleCard key={module.id} module={module} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
