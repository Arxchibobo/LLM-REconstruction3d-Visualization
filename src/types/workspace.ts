// === Workspace Session Manager 类型定义 ===

export type ModuleType = 'skill' | 'mcp' | 'plugin' | 'hook' | 'rule' | 'agent' | 'memory';

export interface WorkspaceModule {
  id: string;
  type: ModuleType;
  name: string;
  description: string;
  tags: string[];
  enabled: boolean;
  icon: string;
}

export type SessionStatus = 'drafting' | 'ready' | 'running' | 'completed' | 'failed';

export interface Session {
  id: string;
  name: string;
  description: string;
  moduleIds: string[];
  messages: ChatMessage[];
  status: SessionStatus;
  position: [number, number, number];
  color: string;
  createdAt: number;
  updatedAt: number;
  result?: string;
}

export interface ModuleRecommendation {
  moduleId: string;
  score: number;
  reason: string;
}

// === Chat types ===

export type ChatMessageRole = 'user' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: number;
  analysis?: SessionAnalysis;
}

export interface SessionAnalysis {
  summary: string;
  detectedIntents: string[];
  recommendedModules: ModuleRecommendation[];
  suggestedActions: SuggestedAction[];
}

export interface SuggestedAction {
  label: string;
  description: string;
  type: 'add-modules' | 'change-status' | 'refine-requirement' | 'info';
  moduleIds?: string[];
  targetStatus?: SessionStatus;
}

// === Drag state ===

export interface DragState {
  isDragging: boolean;
  draggedModule: WorkspaceModule | null;
  dropTarget: string | null;
  worldPosition: [number, number, number] | null;
}
