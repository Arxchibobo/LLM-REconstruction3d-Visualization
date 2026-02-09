import type { ClaudeConfig, ClaudeSkill, ClaudeMCP, ClaudePlugin, ClaudeHook, ClaudeRule, ClaudeAgent, ClaudeMemory } from '@/types/claude-config';
import type { KnowledgeNode, Connection } from '@/types/knowledge';

/**
 * Claude配置加载服务
 * 负责从本地文件系统加载Skills、MCP、Plugins、Hooks、Rules、Agents、Memory等配置
 */
export class ClaudeConfigService {
  private config: ClaudeConfig | null = null;
  private rootPath: string = '';
  private connectionCounter: number = 0; // 用于生成唯一连接ID

  /**
   * 初始化服务，加载Claude配置
   * 添加10秒超时机制防止请求卡住
   */
  async initialize(rootPath?: string): Promise<void> {
    this.rootPath = rootPath || '';

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    try {
      const response = await fetch('/api/claude-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_CLAUDE_CONFIG_API_KEY || 'dev-only-key',
        },
        body: JSON.stringify({ rootPath: this.rootPath }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      this.config = await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      this.config = this.getMockConfig();
    }
  }

  getConfig(): ClaudeConfig | null {
    return this.config;
  }

  getSkills(): ClaudeSkill[] {
    return this.config?.skills || [];
  }

  getMCPs(): ClaudeMCP[] {
    return this.config?.mcps || [];
  }

  getPlugins(): ClaudePlugin[] {
    return this.config?.plugins || [];
  }

  getHooks(): ClaudeHook[] {
    return this.config?.hooks || [];
  }

  getRules(): ClaudeRule[] {
    return this.config?.rules || [];
  }

  getAgents(): ClaudeAgent[] {
    return this.config?.agents || [];
  }

  getMemory(): ClaudeMemory[] {
    return this.config?.memory || [];
  }

  getStats() {
    return {
      totalSkills: this.getSkills().length,
      enabledSkills: this.getSkills().filter(s => s.enabled).length,
      totalMCPs: this.getMCPs().length,
      enabledMCPs: this.getMCPs().filter(m => m.enabled).length,
      totalPlugins: this.getPlugins().length,
      enabledPlugins: this.getPlugins().filter(p => p.enabled).length,
      totalHooks: this.getHooks().length,
      totalRules: this.getRules().length,
      totalAgents: this.getAgents().length,
      totalMemory: this.getMemory().length,
    };
  }

  /**
   * 生成唯一的连接ID
   */
  private createUniqueConnectionId(source: string, target: string): string {
    return `${source}->${target}-${++this.connectionCounter}`;
  }

  /**
   * 将Claude配置转换为KnowledgeNode数组
   * 生成完整的工程化层次结构
   */
  convertToNodes(): { nodes: KnowledgeNode[]; connections: Connection[] } {
    if (!this.config) {
      return { nodes: [], connections: [] };
    }

    // 重置连接计数器
    this.connectionCounter = 0;

    const nodes: KnowledgeNode[] = [];
    const connections: Connection[] = [];

    // ============================================
    // 1. 中心节点 - Claude Code
    // ============================================
    nodes.push({
      id: 'center',
      type: 'claude',
      title: 'Claude Code',
      description: 'Claude Code - AI 智能开发助手',
      filePath: '',
      content: `Model: ${this.config.model || 'unknown'}\nPath: ${this.config.knowledgeBasePath}`,
      tags: ['center', 'claude', 'system'],
      links: [],
      position: [0, 0, 0],
      metadata: {
        size: 0,
        created: new Date(),
        modified: new Date(),
        accessed: new Date(),
        accessCount: 0,
        importance: 1.0,
      },
      visual: {
        color: '#0066ff',
        size: 2.5,
        shape: 'sphere',
        glow: true,
        icon: 'brain',
      },
    });

    // ============================================
    // 2. 工具层 - Categories (直接连接到中心)
    // ============================================
    const categories = [
      { id: 'category-skills', title: 'Skills', color: '#10B981', angle: 0, icon: 'zap' },
      { id: 'category-mcp', title: 'MCP Servers', color: '#06B6D4', angle: Math.PI * 2 / 7, icon: 'server' },
      { id: 'category-plugins', title: 'Plugins', color: '#F59E0B', angle: Math.PI * 4 / 7, icon: 'puzzle' },
      { id: 'category-rules', title: 'Rules', color: '#8B5CF6', angle: Math.PI * 6 / 7, icon: 'file-text' },
      { id: 'category-agents', title: 'Agents', color: '#EC4899', angle: Math.PI * 8 / 7, icon: 'users' },
      { id: 'category-memory', title: 'Memory', color: '#14B8A6', angle: Math.PI * 10 / 7, icon: 'database' },
      { id: 'category-hooks', title: 'Hook Items', color: '#EF4444', angle: Math.PI * 12 / 7, icon: 'anchor' },
    ];

    const categoryRadius = 15;

    categories.forEach((cat) => {
      const position = this.calculateSphericalPosition(categoryRadius, cat.angle, Math.PI / 2);

      nodes.push({
        id: cat.id,
        type: 'category',
        title: cat.title,
        description: `Claude ${cat.title} 配置`,
        filePath: '',
        content: '',
        tags: ['category', 'claude'],
        links: [],
        position,
        metadata: {
          size: 0,
          created: new Date(),
          modified: new Date(),
          accessed: new Date(),
          accessCount: 0,
          importance: 0.9,
        },
        visual: {
          color: cat.color,
          size: 1.5,
          shape: 'cube',
          glow: true,
          icon: cat.icon,
        },
      });

      // 从中心到 Category 的直接连接
      connections.push({
        id: this.createUniqueConnectionId('center', cat.id),
        source: 'center',
        target: cat.id,
        type: 'dependency',
        strength: 0.9,
        label: '路由',
        metadata: { created: new Date(), manual: false },
        visual: { color: '#FF00FF', width: 1.5, dashed: true, animated: false, isSkeleton: true },
      });
    });

    // ============================================
    // 4. 创建各类子节点
    // ============================================
    const itemRadius = 28;

    // Skills
    this.createItemNodes(
      nodes, connections,
      this.getSkills(),
      'category-skills', 'skill',
      0, Math.PI * 2 / 7,
      itemRadius, '#10B981', 'sphere'
    );

    // MCPs
    this.createItemNodes(
      nodes, connections,
      this.getMCPs(),
      'category-mcp', 'mcp',
      Math.PI * 2 / 7, Math.PI * 2 / 7,
      itemRadius, '#06B6D4', 'sphere'
    );

    // Plugins
    this.createItemNodes(
      nodes, connections,
      this.getPlugins(),
      'category-plugins', 'plugin',
      Math.PI * 4 / 7, Math.PI * 2 / 7,
      itemRadius, '#F59E0B', 'sphere'
    );

    // Rules
    this.createItemNodes(
      nodes, connections,
      this.getRules(),
      'category-rules', 'rule',
      Math.PI * 6 / 7, Math.PI * 2 / 7,
      itemRadius, '#8B5CF6', 'sphere'
    );

    // Agents
    this.createItemNodes(
      nodes, connections,
      this.getAgents(),
      'category-agents', 'agent',
      Math.PI * 8 / 7, Math.PI * 2 / 7,
      itemRadius, '#EC4899', 'sphere'
    );

    // Memory
    this.createItemNodes(
      nodes, connections,
      this.getMemory(),
      'category-memory', 'memory',
      Math.PI * 10 / 7, Math.PI * 2 / 7,
      itemRadius, '#14B8A6', 'sphere'
    );

    // Hooks
    this.createItemNodes(
      nodes, connections,
      this.getHooks(),
      'category-hooks', 'hook',
      Math.PI * 12 / 7, Math.PI * 2 / 7,
      itemRadius, '#EF4444', 'sphere'
    );


    return { nodes, connections };
  }

  /**
   * 创建子节点
   */
  private createItemNodes(
    nodes: KnowledgeNode[],
    connections: Connection[],
    items: Array<ClaudeSkill | ClaudeMCP | ClaudePlugin | ClaudeHook | ClaudeRule | ClaudeAgent | ClaudeMemory>,
    parentId: string,
    nodeType: string,
    angleStart: number,
    angleRange: number,
    radius: number,
    color: string,
    shape: string
  ): void {
    if (items.length === 0) return;

    // 使用多层分布避免节点过于密集
    const maxPerLayer = 15;
    const layers = Math.ceil(items.length / maxPerLayer);

    items.forEach((item, index) => {
      const layer = Math.floor(index / maxPerLayer);
      const indexInLayer = index % maxPerLayer;
      const itemsInThisLayer = Math.min(maxPerLayer, items.length - layer * maxPerLayer);

      const layerRadius = radius + layer * 5;
      const angle = angleStart + (angleRange / (itemsInThisLayer + 1)) * (indexInLayer + 1);

      // 添加 Y 轴偏移，形成螺旋
      const yOffset = (layer - layers / 2) * 3;
      const position = this.calculateSphericalPosition(layerRadius, angle, Math.PI / 2);
      position[1] += yOffset;

      const name = 'name' in item ? item.name : 'id' in item ? (item as any).id : 'unknown';
      const description = 'description' in item ? item.description || '' : '';
      const enabled = 'enabled' in item ? item.enabled : true;
      const path = 'path' in item ? item.path || '' : '';

      const nodeId = `${nodeType}-${name}`;

      nodes.push({
        id: nodeId,
        type: nodeType as any,
        title: name,
        description: description || `${nodeType}: ${name}`,
        filePath: path,
        content: JSON.stringify(item, null, 2),
        tags: [nodeType, 'claude'],
        links: [],
        position,
        metadata: {
          size: 1000,
          created: new Date(),
          modified: new Date(),
          accessed: new Date(),
          accessCount: 0,
          importance: enabled ? 0.7 : 0.3,
        },
        visual: {
          color: enabled ? color : '#666666',
          size: enabled ? 0.8 : 0.5,
          shape: shape as any,
          glow: enabled,
          icon: nodeType,
        },
      });

      connections.push({
        id: this.createUniqueConnectionId(parentId, nodeId),
        source: parentId,
        target: nodeId,
        type: 'parent-child',
        strength: 0.5,
        metadata: { created: new Date(), manual: false },
        visual: {
          color: color,
          width: 1,
          dashed: !enabled,
          animated: enabled,
        },
      });
    });
  }

  /**
   * 计算球面坐标位置
   */
  private calculateSphericalPosition(
    radius: number,
    theta: number,
    phi: number
  ): [number, number, number] {
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return [x, y, z];
  }

  /**
   * 模拟配置数据（用于测试）
   */
  private getMockConfig(): ClaudeConfig {
    return {
      skills: [
        { id: 'agent-browser', name: 'agent-browser', description: '浏览器自动化Agent', category: 'automation', enabled: true },
        { id: 'ui-ux-pro-max', name: 'ui-ux-pro-max', description: 'UI/UX设计专家', category: 'design', enabled: true },
      ],
      mcps: [
        { name: 'playwright', description: 'Playwright浏览器自动化', command: 'npx', args: ['@playwright/mcp'], enabled: true },
        { name: 'firebase', description: 'Firebase MCP服务', command: 'firebase-mcp', args: [], enabled: true },
      ],
      plugins: [
        { name: 'backend-development', version: '1.0.0', description: '后端开发插件', enabled: true },
        { name: 'frontend-design', version: '1.0.0', description: '前端设计插件', enabled: true },
      ],
      hooks: [
        { name: 'PreToolUse[0].0', type: 'PreToolUse', matcher: '*', command: 'echo hook', enabled: true },
      ],
      rules: [
        { name: 'coding', description: 'Coding Style', path: '/rules/coding.md', category: 'domain', enabled: true },
      ],
      agents: [
        { name: 'planner', description: 'Implementation planning', path: '/agents/planner', enabled: true },
      ],
      memory: [
        { name: 'history.jsonl', description: '对话历史', path: '/history.jsonl', type: 'history', enabled: true },
      ],
      knowledgeBasePath: this.rootPath,
      model: 'claude-3-opus',
    };
  }
}

// 单例实例
export const claudeConfigService = new ClaudeConfigService();
