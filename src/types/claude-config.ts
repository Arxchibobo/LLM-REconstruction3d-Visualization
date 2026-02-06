// Claude配置相关类型定义

export interface ClaudeSkill {
  id: string;
  name: string;
  description?: string;
  category?: string;
  location?: 'managed' | 'local';
  path?: string;
  enabled: boolean;
}

export interface ClaudeMCP {
  name: string;
  description?: string;
  type?: 'stdio' | 'http';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  source?: string; // 来源目录（如 mcp-xxx）
  enabled: boolean;
}

export interface ClaudePlugin {
  name: string;
  version?: string;
  description?: string;
  marketplace?: string; // 来自哪个 marketplace
  path?: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface ClaudeHook {
  name: string;
  type: 'PreToolUse' | 'PostToolUse' | 'Stop' | 'SubagentStop' | 'SessionStart' | 'SessionEnd' | 'UserPromptSubmit' | 'Notification';
  matcher?: string;
  command?: string;
  timeout?: number;
  enabled: boolean;
}

export interface ClaudeRule {
  name: string;
  description?: string;
  path: string;
  category?: string; // core, domain, delegator 等
  content?: string;
  enabled: boolean;
}

export interface ClaudeAgent {
  name: string;
  description?: string;
  path: string;
  purpose?: string;
  enabled: boolean;
}

export interface ClaudeMemory {
  name: string;
  description?: string;
  path: string;
  type?: 'learning' | 'history' | 'cache';
  enabled: boolean;
}

export interface ClaudeConfig {
  skills: ClaudeSkill[];
  mcps: ClaudeMCP[];
  plugins: ClaudePlugin[];
  hooks: ClaudeHook[];
  rules: ClaudeRule[];
  agents: ClaudeAgent[];
  memory: ClaudeMemory[];
  knowledgeBasePath: string;
  model?: string;
}

export interface ClaudeConfigStats {
  totalSkills: number;
  enabledSkills: number;
  totalMCPs: number;
  enabledMCPs: number;
  totalPlugins: number;
  enabledPlugins: number;
  totalHooks: number;
  totalRules: number;
  totalAgents: number;
  totalMemory: number;
}
