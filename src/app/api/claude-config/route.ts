import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { ClaudeSkill, ClaudeMCP, ClaudePlugin, ClaudeHook, ClaudeRule, ClaudeAgent, ClaudeMemory } from '@/types/claude-config';

// Security: auto-detect allowed Claude config directories
function getAllowedRoots(): string[] {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const roots: string[] = [];

  if (homeDir) {
    roots.push(path.join(homeDir, '.claude'));
  }

  // Allow paths from environment variable
  const extraPath = process.env.CLAUDE_CONFIG_PATH;
  if (extraPath) {
    roots.push(extraPath);
  }

  return roots;
}

/**
 * API Route: 加载本地 Claude 配置
 * 从 settings.json 读取 Skills, MCP, Plugins, Hooks
 * 从文件系统扫描 Rules, Agents, Memory
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 API 授权验证
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.CLAUDE_CONFIG_API_KEY || 'dev-only-key';

    if (apiKey !== expectedKey) {
      // Unauthorized access attempt
      return NextResponse.json(
        { error: 'Unauthorized. Invalid API key.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let rootPath = body.rootPath;

    // Auto-detect Claude config path if not provided
    if (!rootPath || typeof rootPath !== 'string' || rootPath.trim() === '') {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      if (homeDir) {
        rootPath = path.join(homeDir, '.claude');
      } else {
        return NextResponse.json(
          { error: 'Cannot auto-detect Claude config path. Set NEXT_PUBLIC_CLAUDE_CONFIG_PATH environment variable.' },
          { status: 400 }
        );
      }
    }

    const normalizedPath = path.normalize(rootPath);
    const resolvedPath = path.resolve(normalizedPath);

    const allowedRoots = getAllowedRoots();
    const isAllowed = allowedRoots.some(allowed => {
      const normalizedAllowed = path.normalize(allowed);
      return resolvedPath.startsWith(normalizedAllowed);
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Access denied. Path not in allowed directories.' },
        { status: 403 }
      );
    }

    // 1️⃣ 首先读取 settings.json（核心配置文件）
    const settingsPath = path.join(resolvedPath, 'settings.json');
    let settings: any = {};

    try {
      const settingsContent = await fs.readFile(settingsPath, 'utf8');
      settings = JSON.parse(settingsContent);
      // settings.json loaded successfully
    } catch (error) {
      // settings.json not found, using defaults
    }

    // 2️⃣ 并行加载所有组件
    const [skills, mcps, plugins, hooks, rules, agents, memory] = await Promise.all([
      loadSkillsFromSettings(settings, resolvedPath),
      loadMCPsFromSettings(settings, resolvedPath),
      loadPluginsFromSettings(settings, resolvedPath),
      loadHooksFromSettings(settings),
      loadRules(resolvedPath),
      loadAgents(resolvedPath),
      loadMemory(resolvedPath),
    ]);

    return NextResponse.json({
      skills,
      mcps,
      plugins,
      hooks,
      rules,
      agents,
      memory,
      knowledgeBasePath: resolvedPath,
      model: settings.model || 'unknown',
    });
  } catch (error: any) {
    // API route error
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * 从 settings.json 加载 Skills
 */
async function loadSkillsFromSettings(settings: any, rootPath: string): Promise<ClaudeSkill[]> {
  const skills: ClaudeSkill[] = [];

  // 1. 从 settings.skills 读取
  if (settings.skills && Array.isArray(settings.skills)) {
    for (const skill of settings.skills) {
      skills.push({
        id: skill.id || skill.name,
        name: skill.name,
        description: skill.description || '',
        category: skill.category || 'general',
        location: skill.location || 'managed',
        path: skill.path || '',
        enabled: true,
      });
    }
  }

  // 2. 扫描 skills/ 目录补充本地 skills
  try {
    const skillsDir = path.join(rootPath, 'skills');
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(skillsDir, entry.name);
        const configPath = path.join(skillPath, 'skill.json');

        // 检查是否已存在
        if (!skills.find(s => s.name === entry.name)) {
          try {
            const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
            skills.push({
              id: entry.name,
              name: entry.name,
              description: config.description || '',
              category: config.category || 'local',
              location: 'local',
              path: skillPath,
              enabled: config.enabled !== false,
            });
          } catch {
            // 目录存在但无 skill.json
            skills.push({
              id: entry.name,
              name: entry.name,
              description: `Local skill: ${entry.name}`,
              category: 'local',
              location: 'local',
              path: skillPath,
              enabled: true,
            });
          }
        }
      } else if (entry.name.endsWith('.md')) {
        // 支持单文件 skill（如 processing-creative.md）
        const skillName = entry.name.replace('.md', '');
        if (!skills.find(s => s.name === skillName)) {
          skills.push({
            id: skillName,
            name: skillName,
            description: `Markdown skill: ${skillName}`,
            category: 'local',
            location: 'local',
            path: path.join(skillsDir, entry.name),
            enabled: true,
          });
        }
      }
    }
  } catch (error) {
  }

  return skills;
}

/**
 * 从 settings.json 加载 MCP Servers
 */
async function loadMCPsFromSettings(settings: any, rootPath: string): Promise<ClaudeMCP[]> {
  const mcps: ClaudeMCP[] = [];

  // 1. 从 settings.mcpServers 读取
  if (settings.mcpServers && typeof settings.mcpServers === 'object') {
    for (const [name, config] of Object.entries(settings.mcpServers)) {
      const mcpConfig = config as any;
      mcps.push({
        name,
        description: mcpConfig.description || '',
        type: mcpConfig.type || 'stdio',
        command: mcpConfig.command,
        args: mcpConfig.args || [],
        env: mcpConfig.env || {},
        source: 'settings.json',
        enabled: mcpConfig.enabled !== false,
      });
    }
  }

  // 2. 扫描 mcp-* 目录补充
  try {
    const entries = await fs.readdir(rootPath, { withFileTypes: true });
    const mcpDirs = entries.filter(e => e.isDirectory() && e.name.startsWith('mcp-'));

    for (const dir of mcpDirs) {
      const mcpConfigPath = path.join(rootPath, dir.name, 'mcp-config.json');

      try {
        const configContent = await fs.readFile(mcpConfigPath, 'utf8');
        const config = JSON.parse(configContent);

        if (config.mcpServers) {
          for (const [name, mcpConfig] of Object.entries(config.mcpServers)) {
            // 避免重复
            if (!mcps.find(m => m.name === name)) {
              const cfg = mcpConfig as any;
              mcps.push({
                name,
                description: cfg.description || '',
                type: cfg.type || 'stdio',
                command: cfg.command,
                args: cfg.args || [],
                env: cfg.env || {},
                source: dir.name,
                enabled: cfg.enabled !== false,
              });
            }
          }
        }
      } catch {
        // 跳过无效的 mcp 目录
      }
    }
  } catch (error) {
  }

  return mcps;
}

/**
 * 从 settings.json 加载 Plugins
 */
async function loadPluginsFromSettings(settings: any, rootPath: string): Promise<ClaudePlugin[]> {
  const plugins: ClaudePlugin[] = [];

  // 1. 从 settings.enabledPlugins 读取
  if (settings.enabledPlugins && typeof settings.enabledPlugins === 'object') {
    for (const [pluginId, enabled] of Object.entries(settings.enabledPlugins)) {
      // 解析 plugin ID 格式: "plugin-name@marketplace"
      const [name, marketplace] = pluginId.split('@');

      plugins.push({
        name,
        description: `Plugin from ${marketplace || 'unknown'}`,
        marketplace: marketplace || 'unknown',
        enabled: enabled === true,
      });
    }
  }

  // 2. 读取 plugins/installed_plugins.json 获取更多信息
  try {
    const installedPath = path.join(rootPath, 'plugins', 'installed_plugins.json');
    const installedContent = await fs.readFile(installedPath, 'utf8');
    const installedPlugins = JSON.parse(installedContent);

    // 合并详细信息
    if (Array.isArray(installedPlugins)) {
      for (const installed of installedPlugins) {
        const existing = plugins.find(p => p.name === installed.name);
        if (existing) {
          existing.version = installed.version;
          existing.description = installed.description || existing.description;
          existing.path = installed.path;
        }
      }
    }
  } catch {
    // 文件不存在，忽略
  }

  return plugins;
}

/**
 * 从 settings.json 加载 Hooks
 */
async function loadHooksFromSettings(settings: any): Promise<ClaudeHook[]> {
  const hooks: ClaudeHook[] = [];

  if (settings.hooks && typeof settings.hooks === 'object') {
    const hookTypes = ['PreToolUse', 'PostToolUse', 'Stop', 'SubagentStop', 'SessionStart', 'SessionEnd', 'UserPromptSubmit', 'Notification'];

    for (const hookType of hookTypes) {
      const hookList = settings.hooks[hookType];
      if (Array.isArray(hookList)) {
        for (let i = 0; i < hookList.length; i++) {
          const hookEntry = hookList[i];
          const matcher = hookEntry.matcher || '*';

          if (hookEntry.hooks && Array.isArray(hookEntry.hooks)) {
            for (let j = 0; j < hookEntry.hooks.length; j++) {
              const hook = hookEntry.hooks[j];
              hooks.push({
                name: `${hookType}[${i}].${j}`,
                type: hookType as any,
                matcher,
                command: hook.command,
                timeout: hook.timeout,
                enabled: true,
              });
            }
          }
        }
      }
    }
  }

  return hooks;
}

/**
 * 扫描 rules/ 目录加载规则
 */
async function loadRules(rootPath: string): Promise<ClaudeRule[]> {
  const rules: ClaudeRule[] = [];

  async function scanRulesDir(dir: string, category: string = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // 递归扫描子目录
          await scanRulesDir(fullPath, entry.name);
        } else if (entry.name.endsWith('.md')) {
          // 读取规则文件
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const firstLine = content.split('\n')[0] || '';
            const description = firstLine.startsWith('#')
              ? firstLine.replace(/^#+\s*/, '')
              : entry.name.replace('.md', '');

            rules.push({
              name: entry.name.replace('.md', ''),
              description,
              path: fullPath,
              category: category || 'root',
              content: content.substring(0, 500), // 截取前500字符
              enabled: true,
            });
          } catch {
            // 无法读取文件
          }
        }
      }
    } catch {
      // 目录不存在
    }
  }

  await scanRulesDir(path.join(rootPath, 'rules'));

  return rules;
}

/**
 * 扫描 agents/ 目录加载 Agent
 */
async function loadAgents(rootPath: string): Promise<ClaudeAgent[]> {
  const agents: ClaudeAgent[] = [];

  try {
    const agentsDir = path.join(rootPath, 'agents');
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const agentPath = path.join(agentsDir, entry.name);

        // 尝试读取 agent.json 或 README.md
        let description = `Agent: ${entry.name}`;
        let purpose = '';

        try {
          const configPath = path.join(agentPath, 'agent.json');
          const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
          description = config.description || description;
          purpose = config.purpose || '';
        } catch {
          // 尝试读取 README.md
          try {
            const readmePath = path.join(agentPath, 'README.md');
            const readme = await fs.readFile(readmePath, 'utf8');
            const firstLine = readme.split('\n')[0] || '';
            description = firstLine.startsWith('#')
              ? firstLine.replace(/^#+\s*/, '')
              : description;
          } catch {
            // 忽略
          }
        }

        agents.push({
          name: entry.name,
          description,
          path: agentPath,
          purpose,
          enabled: true,
        });
      } else if (entry.name.endsWith('.md')) {
        // 单文件 agent
        agents.push({
          name: entry.name.replace('.md', ''),
          description: `Agent: ${entry.name}`,
          path: path.join(agentsDir, entry.name),
          enabled: true,
        });
      }
    }
  } catch {
  }

  return agents;
}

/**
 * 扫描学习/记忆相关目录
 */
async function loadMemory(rootPath: string): Promise<ClaudeMemory[]> {
  const memory: ClaudeMemory[] = [];

  // 检查 learning/ 目录
  try {
    const learningDir = path.join(rootPath, 'learning');
    const entries = await fs.readdir(learningDir, { withFileTypes: true });

    for (const entry of entries) {
      memory.push({
        name: entry.name,
        description: `Learning: ${entry.name}`,
        path: path.join(learningDir, entry.name),
        type: 'learning',
        enabled: true,
      });
    }
  } catch {
    // 目录不存在
  }

  // 检查 history.jsonl
  try {
    const historyPath = path.join(rootPath, 'history.jsonl');
    await fs.access(historyPath);
    const stats = await fs.stat(historyPath);

    memory.push({
      name: 'history.jsonl',
      description: `对话历史 (${Math.round(stats.size / 1024)}KB)`,
      path: historyPath,
      type: 'history',
      enabled: true,
    });
  } catch {
    // 文件不存在
  }

  // 检查 cache/ 目录
  try {
    const cacheDir = path.join(rootPath, 'cache');
    const entries = await fs.readdir(cacheDir, { withFileTypes: true });

    for (const entry of entries) {
      memory.push({
        name: entry.name,
        description: `Cache: ${entry.name}`,
        path: path.join(cacheDir, entry.name),
        type: 'cache',
        enabled: true,
      });
    }
  } catch {
    // 目录不存在
  }

  return memory;
}
