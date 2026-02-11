'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Trash2, Play, CheckCircle, AlertCircle,
  Zap, Server, Puzzle, Anchor, BookOpen, Bot, Brain,
  PanelRightClose, PanelRightOpen,
  ChevronDown, ChevronRight, MessageSquare,
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import type { ModuleType, SessionStatus } from '@/types/workspace';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const MODULE_TYPE_ICONS: Record<ModuleType, React.ElementType> = {
  skill: Zap, mcp: Server, plugin: Puzzle,
  hook: Anchor, rule: BookOpen, agent: Bot, memory: Brain,
};

const MODULE_TYPE_COLORS: Record<ModuleType, string> = {
  skill: '#10B981', mcp: '#06B6D4', plugin: '#F59E0B',
  hook: '#EF4444', rule: '#8B5CF6', agent: '#EC4899', memory: '#14B8A6',
};

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; Icon: React.ElementType }> = {
  drafting:  { label: 'Drafting',  color: '#00FFFF', Icon: Zap },
  ready:     { label: 'Ready',     color: '#10B981', Icon: CheckCircle },
  running:   { label: 'Running',   color: '#3B82F6', Icon: Play },
  completed: { label: 'Completed', color: '#F59E0B', Icon: CheckCircle },
  failed:    { label: 'Failed',    color: '#EF4444', Icon: AlertCircle },
};

export default function SessionPanel() {
  const {
    selectedSessionId,
    setSelectedSession,
    getSessionById,
    getSessionModules,
    updateSession,
    removeModuleFromSession,
    setSessionStatus,
    deleteSession,
    chatProcessing,
    modules,
    computeRecommendations,
  } = useWorkspaceStore();

  const [panelOpen, setPanelOpen] = useState(true);
  const [modulesExpanded, setModulesExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const session = selectedSessionId ? getSessionById(selectedSessionId) : undefined;
  const sessionModules = selectedSessionId ? getSessionModules(selectedSessionId) : [];
  const messages = session?.messages || [];

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Recompute recommendations when session changes
  useEffect(() => {
    if (selectedSessionId && modules.length > 0) {
      computeRecommendations(selectedSessionId);
    }
  }, [selectedSessionId, modules.length]);

  const handleStart = () => {
    if (!selectedSessionId) return;
    setSessionStatus(selectedSessionId, 'running');
  };

  const handleDelete = () => {
    if (!selectedSessionId) return;
    deleteSession(selectedSessionId);
  };

  if (!panelOpen) {
    return (
      <button
        onClick={() => setPanelOpen(true)}
        className="
          fixed right-0 top-20 z-40
          p-2 bg-[#0F172A] border border-[#1E293B]
          rounded-l-lg text-gray-400 hover:text-[#FF00FF]
          transition-colors
        "
      >
        <PanelRightOpen className="w-5 h-5" />
      </button>
    );
  }

  if (!session) {
    return (
      <aside className="
        fixed right-0 top-16 bottom-10 w-[480px] z-40
        bg-[#0F172A]/95 backdrop-blur-md
        border-l border-[#1E293B]
        flex flex-col
      ">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
          <h2 className="text-sm font-bold text-[#FF00FF] font-mono tracking-wider">
            SESSION
          </h2>
          <button
            onClick={() => setPanelOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-gray-600 text-sm font-mono mb-2">No Session Selected</div>
            <div className="text-gray-700 text-xs">
              Click a session in 3D space or create a new one
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const statusConfig = STATUS_CONFIG[session.status];

  return (
    <aside className="
      fixed right-0 top-16 bottom-10 w-[480px] z-40
      bg-[#0F172A]/95 backdrop-blur-md
      border-l border-[#1E293B]
      flex flex-col overflow-hidden
    ">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
        <h2 className="text-sm font-bold text-[#FF00FF] font-mono tracking-wider">
          SESSION
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="p-1 text-gray-600 hover:text-red-400 transition-colors"
            title="Delete Session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedSession(null)}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Compact Info: name + status in single row */}
      <div className="px-4 py-2.5 border-b border-[#1E293B] space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={session.name}
            onChange={(e) => updateSession(session.id, { name: e.target.value })}
            className="
              flex-1 px-2 py-1
              bg-[#1E293B] border border-[#2D3B4F]
              rounded text-xs text-white
              focus:outline-none focus:border-[#FF00FF]/50
              transition-colors min-w-0
            "
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: statusConfig.color }}
            />
            <span
              className="text-[10px] font-mono font-medium"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-3">
          {/* Welcome prompt when no messages */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="w-8 h-8 text-gray-600 mb-3" />
              <div className="text-gray-500 text-xs font-mono mb-1">
                Describe your requirement
              </div>
              <div className="text-gray-600 text-[10px] max-w-[200px]">
                The system will analyze your needs and recommend modules automatically.
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} sessionId={session.id} />
          ))}

          {/* Typing indicator */}
          {chatProcessing && (
            <div className="flex items-start mb-3">
              <div className="px-3 py-2 bg-[#1E293B] border border-[#2D3B4F] rounded-lg">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Collapsible Module List */}
        {sessionModules.length > 0 && (
          <div className="border-t border-[#1E293B] px-3 py-2">
            <button
              onClick={() => setModulesExpanded(!modulesExpanded)}
              className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono mb-1 hover:text-gray-400 transition-colors w-full"
            >
              {modulesExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              MODULES ({sessionModules.length})
            </button>
            {modulesExpanded && (
              <div className="space-y-1 mt-1">
                {sessionModules.map((m) => {
                  const Icon = MODULE_TYPE_ICONS[m.type];
                  const color = MODULE_TYPE_COLORS[m.type];
                  return (
                    <div
                      key={m.id}
                      className="
                        flex items-center gap-2 px-2 py-1.5
                        bg-[#1E293B]/50 rounded
                        group
                      "
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                      <span className="text-xs text-gray-300 truncate flex-1">{m.name}</span>
                      <button
                        onClick={() => removeModuleFromSession(session.id, m.id)}
                        className="
                          p-0.5 text-gray-600
                          opacity-0 group-hover:opacity-100
                          hover:text-red-400
                          transition-all
                        "
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput sessionId={session.id} />

      {/* Footer: Start Session button (conditional) */}
      {(session.status === 'drafting' || session.status === 'ready') &&
        sessionModules.length > 0 && (
        <div className="p-3 border-t border-[#1E293B]">
          <button
            onClick={handleStart}
            className="
              w-full flex items-center justify-center gap-2
              px-4 py-2
              bg-[#FF00FF]/10 border border-[#FF00FF]/30
              text-[#FF00FF] text-sm font-bold font-mono
              rounded-lg
              hover:bg-[#FF00FF]/20 hover:border-[#FF00FF]/50
              transition-all
            "
          >
            <Play className="w-4 h-4" />
            Start Session
          </button>
        </div>
      )}
    </aside>
  );
}
