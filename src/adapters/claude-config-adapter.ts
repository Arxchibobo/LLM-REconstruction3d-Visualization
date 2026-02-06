/**
 * Claude Config Adapter
 *
 * 解析 Claude Code 配置文件（Skills、Plugins、MCP Servers）
 * 并转换为知识图谱数据结构
 */

import { BaseAdapter, AdapterConfig } from './base';
import { KnowledgeNode, Connection, KnowledgeGraph, NodeType } from '@/types/knowledge';

/**
 * Claude Skill 原始数据结构
 */
interface ClaudeSkill {
  name: string;
  description?: string;
  category?: string;
  plugin?: string;
  subagentType?: string;
}

/**
 * Claude Plugin 原始数据结构
 */
interface ClaudePlugin {
  name: string;
  description?: string;
  skills?: string[];
}

/**
 * Claude MCP Server 原始数据结构
 */
interface ClaudeMCPServer {
  name: string;
  description?: string;
  tools?: string[];
}

/**
 * Claude 配置原始响应
 */
interface ClaudeConfigResponse {
  skills: ClaudeSkill[];
  plugins: ClaudePlugin[];
  mcpServers: ClaudeMCPServer[];
}

export class ClaudeConfigAdapter extends BaseAdapter {
  readonly name = 'claude-config';
  readonly displayName = 'Claude Configuration';
  readonly description = 'Visualize Claude Code skills, plugins, and MCP servers';
  readonly sourceType = 'api' as const;

  constructor(config?: AdapterConfig) {
    super({
      apiEndpoint: '/api/claude-config',
      ...config
    });
  }

  async fetchData(): Promise<KnowledgeGraph> {
    const cacheKey = 'claude-config-data';
    const cached = this.getCachedData<KnowledgeGraph>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(this.config.apiEndpoint!);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData: ClaudeConfigResponse = await response.json();

      if (!this.validateData(rawData)) {
        throw new Error('Invalid data structure from API');
      }

      const graphData = this.transformToGraph(rawData);
      this.setCachedData(cacheKey, graphData);

      return graphData;
    } catch (error) {
      this.handleError(error, 'fetchData');
    }
  }

  /**
   * 将 Claude 配置转换为知识图谱
   */
  private transformToGraph(data: ClaudeConfigResponse): KnowledgeGraph {
    const nodes: KnowledgeNode[] = [];
    const connections: Connection[] = [];

    // 创建中心节点（Claude Robot）
    const claudeCenter: KnowledgeNode = {
      id: 'claude-center',
      type: 'claude' as NodeType,
      title: 'Claude Code',
      description: 'Claude Code - AI 智能开发助手',
      filePath: '',
      content: '',
      tags: ['center', 'claude'],
      links: [],
      position: [0, 0, 0],
      tier: 'CoreSkill',
      // 中心节点没有轨道
      metadata: {
        size: 2.0,
        created: new Date(),
        modified: new Date(),
        accessed: new Date(),
        accessCount: 0,
        importance: 1.0,
      },
      visual: {
        color: '#00FFFF',
        size: 2.0,
        shape: 'dodecahedron',
        glow: true,
        icon: '🤖',
      },
    };
    nodes.push(claudeCenter);

    // 创建适配器节点（核心层）
    const claudeConfigAdapter: KnowledgeNode = {
      id: 'adapter-claude-config',
      type: 'adapter' as NodeType,
      title: 'Claude Config Adapter',
      description: '读取和解析 Claude 配置文件',
      filePath: '',
      content: '',
      tags: ['adapter', 'core'],
      links: [],
      position: [0, 0, 0],
      tier: 'CoreSkill',
      orbit: 1,
      metadata: {
        size: 1.5,
        created: new Date(),
        modified: new Date(),
        accessed: new Date(),
        accessCount: 0,
        importance: 0.9,
      },
      visual: {
        color: '#00FFFF',
        size: 1.5,
        shape: 'octahedron',
        glow: true,
        icon: '🔌',
      },
    };
    nodes.push(claudeConfigAdapter);

    // 连接：Claude → Adapter
    connections.push({
      id: `${claudeCenter.id}->${claudeConfigAdapter.id}`,
      source: claudeCenter.id,
      target: claudeConfigAdapter.id,
      type: 'reference',
      strength: 1.0,
      label: '调用',
      metadata: {
        created: new Date(),
        manual: false,
      },
      visual: {
        color: '#00FFFF',
        width: 2,
        dashed: false,
        animated: true,
      },
    });

    // 创建分类节点
    const categories = new Set<string>();
    data.skills.forEach(skill => {
      if (skill.category) categories.add(skill.category);
    });

    categories.forEach(category => {
      const categoryId = `category-${category}`;
      nodes.push({
        id: categoryId,
        type: 'category' as NodeType,
        title: category,
        description: `${category} category`,
        filePath: '',
        content: '',
        tags: ['category'],
        links: [],
        position: [0, 0, 0],
        tier: 'CoreSkill',
        orbit: 1,
        metadata: {
          size: 1,
          created: new Date(),
          modified: new Date(),
          accessed: new Date(),
          accessCount: 0,
          importance: 0.8,
        },
        visual: {
          color: '#FFFFFF',
          size: 1.2,
          shape: 'octahedron',
          glow: true,
          icon: '📁',
        },
      });

      // 连接：Adapter → Category
      connections.push({
        id: `${claudeConfigAdapter.id}->${categoryId}`,
        source: claudeConfigAdapter.id,
        target: categoryId,
        type: 'dependency',
        strength: 0.7,
        label: '获取数据',
        metadata: {
          created: new Date(),
          manual: false,
        },
        visual: {
          color: '#FF00FF',
          width: 1.5,
          dashed: true,
          animated: false,
        },
      });
    });

    // 创建 Plugin 和 MCP 的分类节点
    const pluginCategoryId = 'category-Plugins';
    nodes.push({
      id: pluginCategoryId,
      type: 'category' as NodeType,
      title: 'Plugins',
      description: 'Plugin 插件系统',
      filePath: '',
      content: '',
      tags: ['category'],
      links: [],
      position: [0, 0, 0],
      tier: 'CoreSkill',
      orbit: 1,
      metadata: {
        size: 1,
        created: new Date(),
        modified: new Date(),
        accessed: new Date(),
        accessCount: 0,
        importance: 0.8,
      },
      visual: {
        color: '#FFFFFF',
        size: 1.2,
        shape: 'octahedron',
        glow: true,
        icon: '🧩',
      },
    });

    // 连接：Adapter → Plugin Category
    connections.push({
      id: `${claudeConfigAdapter.id}->${pluginCategoryId}`,
      source: claudeConfigAdapter.id,
      target: pluginCategoryId,
      type: 'dependency',
      strength: 0.7,
      label: '获取数据',
      metadata: {
        created: new Date(),
        manual: false,
      },
      visual: {
        color: '#FF00FF',
        width: 1.5,
        dashed: true,
        animated: false,
      },
    });

    const mcpCategoryId = 'category-MCP-Servers';
    nodes.push({
      id: mcpCategoryId,
      type: 'category' as NodeType,
      title: 'MCP Servers',
      description: 'MCP 服务器系统',
      filePath: '',
      content: '',
      tags: ['category'],
      links: [],
      position: [0, 0, 0],
      tier: 'CoreSkill',
      orbit: 1,
      metadata: {
        size: 1,
        created: new Date(),
        modified: new Date(),
        accessed: new Date(),
        accessCount: 0,
        importance: 0.8,
      },
      visual: {
        color: '#FFFFFF',
        size: 1.2,
        shape: 'octahedron',
        glow: true,
        icon: '🌐',
      },
    });

    // 连接：Adapter → MCP Category
    connections.push({
      id: `${claudeConfigAdapter.id}->${mcpCategoryId}`,
      source: claudeConfigAdapter.id,
      target: mcpCategoryId,
      type: 'dependency',
      strength: 0.7,
      label: '获取数据',
      metadata: {
        created: new Date(),
        manual: false,
      },
      visual: {
        color: '#FF00FF',
        width: 1.5,
        dashed: true,
        animated: false,
      },
    });

    // 创建 Skill 节点
    data.skills.forEach(skill => {
      const node = this.parseNode({ ...skill, nodeType: 'skill' });
      nodes.push(node);

      // 连接到分类
      if (skill.category) {
        connections.push(this.parseConnection({
          source: node.id,
          target: `category-${skill.category}`,
          type: 'parent-child',
          strength: 0.7,
        }));
      }
    });

    // 创建 Plugin 节点
    data.plugins.forEach(plugin => {
      const node = this.parseNode({ ...plugin, nodeType: 'plugin' });
      nodes.push(node);

      // 连接到分类
      connections.push(this.parseConnection({
        source: node.id,
        target: pluginCategoryId,
        type: 'parent-child',
        strength: 0.7,
      }));
    });

    // 创建 MCP Server 节点
    data.mcpServers.forEach(mcp => {
      const node = this.parseNode({ ...mcp, nodeType: 'mcp' });
      nodes.push(node);

      // 连接到分类
      connections.push(this.parseConnection({
        source: node.id,
        target: mcpCategoryId,
        type: 'parent-child',
        strength: 0.7,
      }));
    });


    return {
      nodes,
      connections,
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        totalSize: nodes.length + connections.length,
        fileCount: nodes.length,
      },
    };
  }

  parseNode(raw: any): KnowledgeNode {
    const nodeType = raw.nodeType || 'skill';

    return {
      id: `${nodeType}-${raw.name}`,
      type: nodeType as NodeType,
      title: raw.name,
      description: raw.description || '',
      filePath: '',
      content: '',
      tags: [raw.category || nodeType],
      links: [],
      position: [0, 0, 0],
      tier: 'Skill',
      orbit: 2,
      metadata: {
        size: 1,
        created: new Date(),
        modified: new Date(),
        accessed: new Date(),
        accessCount: 0,
        importance: 0.5,
      },
      visual: {
        color: '#FFFFFF',
        size: 0.8,
        shape: 'sphere',
        glow: false,
        icon: '📄',
      },
    };
  }

  parseConnection(raw: any): Connection {
    return {
      id: `${raw.source}->${raw.target}`,
      source: raw.source,
      target: raw.target,
      type: raw.type || 'related',
      strength: raw.strength || 0.5,
      label: raw.label,
      metadata: {
        created: new Date(),
        manual: false,
      },
      visual: {
        color: '#808080',
        width: 1,
        dashed: false,
        animated: false,
      },
    };
  }

  validateData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.skills) &&
      Array.isArray(data.plugins) &&
      Array.isArray(data.mcpServers)
    );
  }

  async getStatistics() {
    try {
      const data = await this.fetchData();
      const categories = new Set(
        data.nodes
          .filter(n => n.type === 'skill')
          .map(n => n.tags[0])
          .filter(Boolean)
      );

      return {
        nodeCount: data.nodes.length,
        connectionCount: data.connections.length,
        categories: Array.from(categories) as string[],
        lastUpdated: new Date()
      };
    } catch (error) {
      this.handleError(error, 'getStatistics');
    }
  }

  async refresh(): Promise<boolean> {
    try {
      this.clearCache();
      await this.fetchData();
      return true;
    } catch (error) {
      console.error('[ClaudeConfigAdapter] Refresh failed:', error);
      return false;
    }
  }
}
