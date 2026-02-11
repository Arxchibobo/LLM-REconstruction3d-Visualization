import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WorkspaceModule,
  Session,
  ModuleRecommendation,
  DragState,
  SessionStatus,
  ModuleType,
  ChatMessage,
  SuggestedAction,
} from '@/types/workspace';
import type { ClaudeConfig } from '@/types/claude-config';
import { computeModuleRecommendations } from '@/utils/recommendations';
import { generateChatResponse } from '@/utils/chatResponseGenerator';

// Session 自动配色循环
const SESSION_COLORS = [
  '#00FFFF', '#FF00FF', '#FFFF00', '#FF6B6B',
  '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD',
];

// 图标映射
const MODULE_TYPE_ICONS: Record<ModuleType, string> = {
  skill: 'Zap',
  mcp: 'Server',
  plugin: 'Puzzle',
  hook: 'Anchor',
  rule: 'BookOpen',
  agent: 'Bot',
  memory: 'Brain',
};

// 网格布局参数
const GRID_SPACING = 35;
const GRID_COLS = 4;

function getGridPosition(index: number): [number, number, number] {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  const offsetX = ((GRID_COLS - 1) * GRID_SPACING) / 2;
  const offsetZ = (Math.floor(index / GRID_COLS) * GRID_SPACING) / 2;
  return [
    col * GRID_SPACING - offsetX,
    0,
    row * GRID_SPACING - Math.min(offsetZ, GRID_SPACING),
  ];
}

function flattenConfigToModules(config: ClaudeConfig): WorkspaceModule[] {
  const modules: WorkspaceModule[] = [];

  for (const s of config.skills) {
    modules.push({
      id: `skill-${s.id || s.name}`,
      type: 'skill',
      name: s.name,
      description: s.description || '',
      tags: [s.category || 'general', 'skill'].filter(Boolean),
      enabled: s.enabled,
      icon: MODULE_TYPE_ICONS.skill,
    });
  }

  for (const m of config.mcps) {
    modules.push({
      id: `mcp-${m.name}`,
      type: 'mcp',
      name: m.name,
      description: m.description || '',
      tags: ['mcp', m.type || 'stdio'].filter(Boolean),
      enabled: m.enabled,
      icon: MODULE_TYPE_ICONS.mcp,
    });
  }

  for (const p of config.plugins) {
    modules.push({
      id: `plugin-${p.name}`,
      type: 'plugin',
      name: p.name,
      description: p.description || '',
      tags: ['plugin', p.marketplace || ''].filter(Boolean),
      enabled: p.enabled,
      icon: MODULE_TYPE_ICONS.plugin,
    });
  }

  for (const h of config.hooks) {
    modules.push({
      id: `hook-${h.name}`,
      type: 'hook',
      name: h.name,
      description: `${h.type} hook${h.matcher ? ` (${h.matcher})` : ''}`,
      tags: ['hook', h.type].filter(Boolean),
      enabled: h.enabled,
      icon: MODULE_TYPE_ICONS.hook,
    });
  }

  for (const r of config.rules) {
    modules.push({
      id: `rule-${r.name}`,
      type: 'rule',
      name: r.name,
      description: r.description || '',
      tags: ['rule', r.category || ''].filter(Boolean),
      enabled: r.enabled,
      icon: MODULE_TYPE_ICONS.rule,
    });
  }

  for (const a of config.agents) {
    modules.push({
      id: `agent-${a.name}`,
      type: 'agent',
      name: a.name,
      description: a.description || a.purpose || '',
      tags: ['agent'].filter(Boolean),
      enabled: a.enabled,
      icon: MODULE_TYPE_ICONS.agent,
    });
  }

  for (const mem of config.memory) {
    modules.push({
      id: `memory-${mem.name}`,
      type: 'memory',
      name: mem.name,
      description: mem.description || '',
      tags: ['memory', mem.type || ''].filter(Boolean),
      enabled: mem.enabled,
      icon: MODULE_TYPE_ICONS.memory,
    });
  }

  return modules;
}

interface WorkspaceStore {
  // Module palette
  modules: WorkspaceModule[];
  modulesLoading: boolean;

  // Module multi-selection
  selectedModules: Set<string>;

  // Sessions
  sessions: Session[];
  selectedSessionId: string | null;

  // Drag-and-drop
  dragState: DragState;

  // Recommendations
  recommendations: ModuleRecommendation[];

  // Palette UI
  paletteOpen: boolean;
  paletteSearch: string;
  paletteFilter: ModuleType | null;

  // Chat
  chatInputDraft: Record<string, string>;
  chatProcessing: boolean;

  // Camera ref (for raycast from HTML drag handlers)
  cameraRef: THREE.Camera | null;
  canvasRect: DOMRect | null;

  // Actions: Modules
  loadModules: () => Promise<void>;

  // Actions: Sessions
  createSession: (name: string, description?: string) => string;
  deleteSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<Pick<Session, 'name' | 'description' | 'result'>>) => void;
  setSelectedSession: (sessionId: string | null) => void;
  setSessionStatus: (sessionId: string, status: SessionStatus) => void;

  // Actions: Module <-> Session
  addModuleToSession: (sessionId: string, moduleId: string) => void;
  removeModuleFromSession: (sessionId: string, moduleId: string) => void;

  // Actions: Drag-and-drop
  startDrag: (module: WorkspaceModule) => void;
  updateDragWorldPosition: (pos: [number, number, number]) => void;
  setDropTarget: (target: string | null) => void;
  endDrag: () => void;
  executeDrop: () => { action: 'added' | 'new-session'; sessionId?: string } | null;

  // Actions: Recommendations
  computeRecommendations: (sessionId: string) => void;
  clearRecommendations: () => void;

  // Actions: Palette UI
  setPaletteOpen: (open: boolean) => void;
  setPaletteSearch: (query: string) => void;
  setPaletteFilter: (type: ModuleType | null) => void;

  // Actions: Module selection
  toggleModuleSelection: (moduleId: string, isMultiSelect?: boolean) => void;
  clearModuleSelection: () => void;
  selectAllModules: () => void;

  // Actions: Chat
  sendMessage: (sessionId: string, content: string) => void;
  setChatInputDraft: (sessionId: string, draft: string) => void;
  applyAction: (sessionId: string, action: SuggestedAction) => void;

  // Actions: Camera
  setCameraRef: (camera: THREE.Camera | null) => void;
  setCanvasRect: (rect: DOMRect | null) => void;

  // Computed helpers
  getSessionModules: (sessionId: string) => WorkspaceModule[];
  getFilteredPaletteModules: () => WorkspaceModule[];
  getSessionById: (sessionId: string) => Session | undefined;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      modules: [],
      modulesLoading: false,
      selectedModules: new Set(),
      sessions: [],
      selectedSessionId: null,
      dragState: {
        isDragging: false,
        draggedModule: null,
        dropTarget: null,
        worldPosition: null,
      },
      recommendations: [],
      paletteOpen: true,
      paletteSearch: '',
      paletteFilter: null,
      chatInputDraft: {},
      chatProcessing: false,
      cameraRef: null,
      canvasRect: null,

      // === Module loading ===
      loadModules: async () => {
        set({ modulesLoading: true });
        try {
          const response = await fetch('/api/claude-config', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.NEXT_PUBLIC_CLAUDE_CONFIG_API_KEY || 'dev-only-key',
            },
            body: JSON.stringify({ rootPath: '' }),
          });

          if (!response.ok) throw new Error(`API failed: ${response.status}`);

          const config: ClaudeConfig = await response.json();
          const modules = flattenConfigToModules(config);
          set({ modules, modulesLoading: false });
        } catch (error) {
          console.error('Failed to load workspace modules:', error);
          set({ modulesLoading: false });
        }
      },

      // === Session CRUD ===
      createSession: (name, description = '') => {
        const { sessions } = get();
        const id = crypto.randomUUID();
        const position = getGridPosition(sessions.length);
        const color = SESSION_COLORS[sessions.length % SESSION_COLORS.length];

        const newSession: Session = {
          id,
          name,
          description,
          moduleIds: [],
          messages: [],
          status: 'drafting',
          position,
          color,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set({ sessions: [...sessions, newSession], selectedSessionId: id });
        return id;
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          selectedSessionId:
            state.selectedSessionId === sessionId ? null : state.selectedSessionId,
        }));
      },

      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...updates, updatedAt: Date.now() } : s
          ),
        }));
      },

      setSelectedSession: (sessionId) => {
        set({ selectedSessionId: sessionId });
      },

      setSessionStatus: (sessionId, status) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, status, updatedAt: Date.now() } : s
          ),
        }));
      },

      // === Module <-> Session ===
      addModuleToSession: (sessionId, moduleId) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            if (s.moduleIds.includes(moduleId)) return s;
            return {
              ...s,
              moduleIds: [...s.moduleIds, moduleId],
              updatedAt: Date.now(),
            };
          }),
        }));
        // Recompute recommendations
        get().computeRecommendations(sessionId);
      },

      removeModuleFromSession: (sessionId, moduleId) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              moduleIds: s.moduleIds.filter((id) => id !== moduleId),
              updatedAt: Date.now(),
            };
          }),
        }));
        get().computeRecommendations(sessionId);
      },

      // === Drag-and-drop ===
      startDrag: (module) => {
        set({
          dragState: {
            isDragging: true,
            draggedModule: module,
            dropTarget: null,
            worldPosition: null,
          },
        });
      },

      updateDragWorldPosition: (pos) => {
        set((state) => ({
          dragState: { ...state.dragState, worldPosition: pos },
        }));
      },

      setDropTarget: (target) => {
        set((state) => ({
          dragState: { ...state.dragState, dropTarget: target },
        }));
      },

      endDrag: () => {
        set({
          dragState: {
            isDragging: false,
            draggedModule: null,
            dropTarget: null,
            worldPosition: null,
          },
        });
      },

      executeDrop: () => {
        const { dragState, sessions } = get();
        if (!dragState.isDragging || !dragState.draggedModule) return null;

        const moduleId = dragState.draggedModule.id;

        // Drop onto existing session
        if (dragState.dropTarget && dragState.dropTarget !== 'canvas-empty') {
          const session = sessions.find((s) => s.id === dragState.dropTarget);
          if (session) {
            get().addModuleToSession(session.id, moduleId);
            get().endDrag();
            return { action: 'added', sessionId: session.id };
          }
        }

        // Drop onto empty canvas → signal to open CreateSessionDialog
        get().endDrag();
        return { action: 'new-session' };
      },

      // === Recommendations ===
      computeRecommendations: (sessionId) => {
        const { sessions, modules } = get();
        const session = sessions.find((s) => s.id === sessionId);
        if (!session) {
          set({ recommendations: [] });
          return;
        }

        const sessionModuleIds = new Set(session.moduleIds);
        const results = computeModuleRecommendations(session, modules, sessionModuleIds);
        set({ recommendations: results });
      },

      clearRecommendations: () => {
        set({ recommendations: [] });
      },

      // === Palette UI ===
      setPaletteOpen: (open) => set({ paletteOpen: open }),
      setPaletteSearch: (query) => set({ paletteSearch: query }),
      setPaletteFilter: (type) => set({ paletteFilter: type }),

      // === Module selection ===
      toggleModuleSelection: (moduleId, isMultiSelect = false) => {
        set((state) => {
          const newSelection = new Set(state.selectedModules);

          if (!isMultiSelect) {
            // Single select mode - clear previous and select only this one
            newSelection.clear();
            newSelection.add(moduleId);
          } else {
            // Multi-select mode - toggle this module
            if (newSelection.has(moduleId)) {
              newSelection.delete(moduleId);
            } else {
              newSelection.add(moduleId);
            }
          }

          return { selectedModules: newSelection };
        });
      },

      clearModuleSelection: () => set({ selectedModules: new Set() }),

      selectAllModules: () => {
        const { modules } = get();
        set({ selectedModules: new Set(modules.map((m) => m.id)) });
      },

      // === Chat ===
      sendMessage: async (sessionId, content) => {
        const { sessions, modules } = get();
        const session = sessions.find((s) => s.id === sessionId);
        if (!session) return;

        const userMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content,
          timestamp: Date.now(),
        };

        // Append user message and update description with aggregated text
        const updatedMessages = [...(session.messages || []), userMsg];
        const updatedSession: Session = {
          ...session,
          messages: updatedMessages,
          description: content, // latest message becomes the primary description
          updatedAt: Date.now(),
        };

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? updatedSession : s
          ),
          chatProcessing: true,
          chatInputDraft: { ...state.chatInputDraft, [sessionId]: '' },
        }));

        // Build conversation history for API
        const freshState = get();
        const freshSession = freshState.sessions.find((s) => s.id === sessionId);
        if (!freshSession) {
          set({ chatProcessing: false });
          return;
        }

        // Local analysis for structured UI elements (intents, recommendations, actions)
        const analysis = generateChatResponse(freshSession, freshState.modules);

        // Build session context for the API
        const sessionModules = freshSession.moduleIds
          .map((id) => freshState.modules.find((m) => m.id === id))
          .filter(Boolean)
          .map((m) => ({ name: m!.name, type: m!.type, description: m!.description }));

        // Build message history (convert system → assistant for API)
        const apiMessages = freshSession.messages
          .map((m) => ({
            role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant',
            content: m.content,
          }));

        let aiContent: string;

        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: apiMessages,
              sessionContext: {
                name: freshSession.name,
                status: freshSession.status,
                modules: sessionModules,
              },
            }),
          });

          if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
          }

          const data = await res.json();
          aiContent = data.content || analysis.summary;
        } catch {
          // Fallback to local analysis if Bedrock is unavailable
          aiContent = analysis.summary;
        }

        const systemMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'system',
          content: aiContent,
          timestamp: Date.now(),
          analysis,
        };

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...(s.messages || []), systemMsg],
                  updatedAt: Date.now(),
                }
              : s
          ),
          recommendations: analysis.recommendedModules,
          chatProcessing: false,
        }));
      },

      setChatInputDraft: (sessionId, draft) => {
        set((state) => ({
          chatInputDraft: { ...state.chatInputDraft, [sessionId]: draft },
        }));
      },

      applyAction: (sessionId, action) => {
        const { sessions } = get();
        const session = sessions.find((s) => s.id === sessionId);
        if (!session) return;

        if (action.type === 'add-modules' && action.moduleIds) {
          const existingIds = new Set(session.moduleIds);
          const newIds = action.moduleIds.filter((id) => !existingIds.has(id));
          if (newIds.length > 0) {
            set((state) => ({
              sessions: state.sessions.map((s) =>
                s.id === sessionId
                  ? { ...s, moduleIds: [...s.moduleIds, ...newIds], updatedAt: Date.now() }
                  : s
              ),
            }));
          }

          // Add confirmation message
          const confirmMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Added ${newIds.length} module${newIds.length > 1 ? 's' : ''} to this session.`,
            timestamp: Date.now(),
          };
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? { ...s, messages: [...(s.messages || []), confirmMsg] }
                : s
            ),
          }));

          get().computeRecommendations(sessionId);
        }

        if (action.type === 'change-status' && action.targetStatus) {
          get().setSessionStatus(sessionId, action.targetStatus);

          const confirmMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Session status changed to **${action.targetStatus}**.`,
            timestamp: Date.now(),
          };
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? { ...s, messages: [...(s.messages || []), confirmMsg] }
                : s
            ),
          }));
        }
      },

      // === Camera ===
      setCameraRef: (camera) => set({ cameraRef: camera }),
      setCanvasRect: (rect) => set({ canvasRect: rect }),

      // === Computed helpers ===
      getSessionModules: (sessionId) => {
        const { sessions, modules } = get();
        const session = sessions.find((s) => s.id === sessionId);
        if (!session) return [];
        return session.moduleIds
          .map((id) => modules.find((m) => m.id === id))
          .filter((m): m is WorkspaceModule => m !== undefined);
      },

      getFilteredPaletteModules: () => {
        const { modules, paletteSearch, paletteFilter } = get();
        let filtered = modules;

        if (paletteFilter) {
          filtered = filtered.filter((m) => m.type === paletteFilter);
        }

        if (paletteSearch.trim()) {
          const q = paletteSearch.toLowerCase();
          filtered = filtered.filter(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              m.description.toLowerCase().includes(q) ||
              m.tags.some((t) => t.toLowerCase().includes(q))
          );
        }

        return filtered;
      },

      getSessionById: (sessionId) => {
        return get().sessions.find((s) => s.id === sessionId);
      },
    }),
    {
      name: 'workspace-sessions-v1',
      partialize: (state) => ({
        sessions: state.sessions,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<WorkspaceStore>;
        // Ensure backward compat: add messages array to sessions that don't have it
        const sessions = (persistedState.sessions || []).map((s) => ({
          ...s,
          messages: s.messages || [],
        }));
        return {
          ...current,
          ...persistedState,
          sessions,
        };
      },
    }
  )
);
