import { KnowledgeNode, Connection } from '@/types/knowledge';
import { getColorByLayer } from './colors';

/**
 * 工程化3层轨道布局算法
 *
 * 设计理念：
 * - 中心：Claude Robot (使用者)
 * - 第1轨道 (核心层): Adapters - 如何获取数据
 * - 第2轨道 (工具层): Skills/MCP/Plugins - 工具和服务
 * - 第3轨道 (资源层): 具体实例 - 资源节点
 *
 * 配色方案：
 * - 核心层: 青色 #00FFFF (半径 8)
 * - 工具层: 品红 #FF00FF (半径 15)
 * - 资源层: 橙色 #FFA500 (半径 25)
 */

export interface EngineeringLayoutConfig {
  coreRadius: number;      // 核心层半径
  toolRadius: number;      // 工具层半径
  resourceRadius: number;  // 资源层半径
  verticalSpread: number;  // 垂直分散度
  layerHeight: number;     // 层间高度差
}

const DEFAULT_CONFIG: EngineeringLayoutConfig = {
  coreRadius: 8,
  toolRadius: 15,
  resourceRadius: 25,
  verticalSpread: 0,   // 🔄 改为0：全部落在水平面上，提高可读性
  layerHeight: 0,      // 🔄 改为0：不设层高差，保持水平
};

/**
 * 节点层级类型
 */
export type NodeLayer = 'center' | 'core' | 'tool' | 'resource';

/**
 * 节点角色类型
 */
export type NodeRole =
  | 'claude'        // Claude Code 中心
  | 'adapter'       // 适配器
  | 'skill'         // Skill
  | 'mcp'           // MCP Server
  | 'plugin'        // Plugin
  | 'document'      // 文档
  | 'category'      // 分类节点
  | 'hook'          // Hook
  | 'rule'          // Rule
  | 'agent'         // Agent
  | 'memory';       // Memory

/**
 * 确定节点所在层级
 */
export function determineNodeLayer(node: KnowledgeNode): NodeLayer {
  const type = node.type?.toLowerCase() || '';
  const title = node.title?.toLowerCase() || '';
  const id = node.id?.toLowerCase() || '';

  // 中心节点
  if (type === 'claude' || id === 'center') {
    return 'center';
  }

  // 核心层：Adapters 和 Hooks Layer（拦截层）
  if (type === 'adapter' || title.includes('adapter')) {
    return 'core';
  }
  // layer-hooks 是核心拦截层
  if (id === 'layer-hooks' || title.includes('hooks layer')) {
    return 'core';
  }

  // 工具层：Category 节点 (Skills Category, MCP Category, Plugins Category)
  if (
    type === 'category' ||
    id.startsWith('category-') ||
    title.includes('category') ||
    title.includes('skills category') ||
    title.includes('mcp category') ||
    title.includes('plugins category')
  ) {
    return 'tool';
  }

  // 资源层：具体的 Skill/MCP/Plugin/Hook/Rule/Agent/Memory 实例
  if (
    type === 'skill' ||
    type === 'mcp' ||
    type === 'plugin' ||
    type === 'document' ||
    type === 'hook' ||
    type === 'rule' ||
    type === 'agent' ||
    type === 'memory'
  ) {
    return 'resource';
  }

  // 默认资源层
  return 'resource';
}

/**
 * 确定节点角色
 */
export function determineNodeRole(node: KnowledgeNode): NodeRole {
  const type = node.type?.toLowerCase() || '';
  const title = node.title?.toLowerCase() || '';
  const id = node.id?.toLowerCase() || '';

  if (type === 'claude' || id === 'center') {
    return 'claude';
  }
  if (type === 'adapter' || title.includes('adapter')) {
    return 'adapter';
  }
  if (type === 'skill') {
    return 'skill';
  }
  if (type === 'mcp') {
    return 'mcp';
  }
  if (type === 'plugin') {
    return 'plugin';
  }
  if (type === 'hook') {
    return 'hook';
  }
  if (type === 'rule') {
    return 'rule';
  }
  if (type === 'agent') {
    return 'agent';
  }
  if (type === 'memory') {
    return 'memory';
  }
  if (type === 'document') {
    return 'document';
  }
  if (type === 'category' || title.includes('category') || id.startsWith('category-')) {
    return 'category';
  }

  return 'document';
}

/**
 * 计算工程化3层轨道布局
 */
export function calculateEngineeringLayout(
  nodes: KnowledgeNode[],
  config: EngineeringLayoutConfig = DEFAULT_CONFIG
): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();

  // 按层级分组节点
  const centerNodes: KnowledgeNode[] = [];
  const coreNodes: KnowledgeNode[] = [];
  const toolNodes: KnowledgeNode[] = [];
  const resourceNodes: KnowledgeNode[] = [];

  for (const node of nodes) {
    const layer = determineNodeLayer(node);
    switch (layer) {
      case 'center':
        centerNodes.push(node);
        break;
      case 'core':
        coreNodes.push(node);
        break;
      case 'tool':
        toolNodes.push(node);
        break;
      case 'resource':
        resourceNodes.push(node);
        break;
    }
  }

  // 布局中心节点 (Claude Robot)
  layoutCenterNodes(centerNodes, positions);

  // 布局核心层 (Adapters)
  layoutLayerNodes(coreNodes, config.coreRadius, 0, config, positions);

  // 布局工具层 (Skills/MCP/Plugins Categories)
  layoutLayerNodes(toolNodes, config.toolRadius, config.layerHeight, config, positions);

  // 布局资源层 (具体实例)
  layoutResourceNodes(resourceNodes, config.resourceRadius, config.layerHeight * 2, config, positions);

  return positions;
}

/**
 * 布局中心节点 (Claude Robot)
 */
function layoutCenterNodes(
  nodes: KnowledgeNode[],
  positions: Map<string, [number, number, number]>
): void {
  // 中心节点固定在原点
  for (const node of nodes) {
    positions.set(node.id, [0, 0, 0]);
  }

  // 如果没有中心节点,创建一个虚拟的
  if (nodes.length === 0) {
    positions.set('__claude_center__', [0, 0, 0]);
  }
}

/**
 * 布局层级节点 (核心层和工具层)
 */
function layoutLayerNodes(
  nodes: KnowledgeNode[],
  radius: number,
  baseHeight: number,
  config: EngineeringLayoutConfig,
  positions: Map<string, [number, number, number]>
): void {
  const count = nodes.length;
  if (count === 0) return;

  nodes.forEach((node, index) => {
    // 均匀分布在圆周上
    const angle = (index / count) * Math.PI * 2;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // 🔄 Y坐标固定为0：全部落在水平面上，提高3D空间可读性
    const y = 0;

    positions.set(node.id, [x, y, z]);
  });
}

/**
 * 布局资源层节点 (具体实例)
 * 资源层节点数量最多,需要按类型分组布局
 */
function layoutResourceNodes(
  nodes: KnowledgeNode[],
  radius: number,
  baseHeight: number,
  config: EngineeringLayoutConfig,
  positions: Map<string, [number, number, number]>
): void {
  if (nodes.length === 0) return;

  // 按类型分组（包含新类型 hook, rule, agent, memory）
  const skillNodes = nodes.filter(n => n.type === 'skill');
  const mcpNodes = nodes.filter(n => n.type === 'mcp');
  const pluginNodes = nodes.filter(n => n.type === 'plugin');
  const hookNodes = nodes.filter(n => n.type === 'hook');
  const ruleNodes = nodes.filter(n => n.type === 'rule');
  const agentNodes = nodes.filter(n => n.type === 'agent');
  const memoryNodes = nodes.filter(n => n.type === 'memory');
  const documentNodes = nodes.filter(n => n.type === 'document');

  // 计算每个组的角度范围（8组）
  const totalGroups = 8;
  const anglePerGroup = (Math.PI * 2) / totalGroups;

  // Skills: 0 - 45度
  layoutGroupInArc(skillNodes, radius, baseHeight, 0, anglePerGroup, config, positions);

  // MCPs: 45 - 90度
  layoutGroupInArc(mcpNodes, radius, baseHeight, anglePerGroup, anglePerGroup * 2, config, positions);

  // Plugins: 90 - 135度
  layoutGroupInArc(pluginNodes, radius, baseHeight, anglePerGroup * 2, anglePerGroup * 3, config, positions);

  // Hooks: 135 - 180度
  layoutGroupInArc(hookNodes, radius, baseHeight, anglePerGroup * 3, anglePerGroup * 4, config, positions);

  // Rules: 180 - 225度
  layoutGroupInArc(ruleNodes, radius, baseHeight, anglePerGroup * 4, anglePerGroup * 5, config, positions);

  // Agents: 225 - 270度
  layoutGroupInArc(agentNodes, radius, baseHeight, anglePerGroup * 5, anglePerGroup * 6, config, positions);

  // Memory: 270 - 315度
  layoutGroupInArc(memoryNodes, radius, baseHeight, anglePerGroup * 6, anglePerGroup * 7, config, positions);

  // Documents: 315 - 360度
  layoutGroupInArc(documentNodes, radius, baseHeight, anglePerGroup * 7, anglePerGroup * 8, config, positions);
}

/**
 * 在弧形区域内布局一组节点
 */
function layoutGroupInArc(
  nodes: KnowledgeNode[],
  radius: number,
  baseHeight: number,
  startAngle: number,
  endAngle: number,
  config: EngineeringLayoutConfig,
  positions: Map<string, [number, number, number]>
): void {
  const count = nodes.length;
  if (count === 0) return;

  const angleRange = endAngle - startAngle;

  nodes.forEach((node, index) => {
    // 在分配的角度范围内均匀分布
    const angle = startAngle + (index / Math.max(count - 1, 1)) * angleRange;

    // 使用基于索引的确定性变化，避免 Math.random() 导致重渲染时节点跳动
    const radiusVariation = (((index * 7 + 3) % 11) / 11 - 0.5) * 2;
    const r = radius + radiusVariation;

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    // 🔄 Y坐标固定为0：全部落在水平面上，提高3D空间可读性
    const y = 0;

    positions.set(node.id, [x, y, z]);
  });
}

/**
 * 为节点应用工程化布局和样式
 */
export function applyEngineeringStyles(
  nodes: KnowledgeNode[],
  positions: Map<string, [number, number, number]>
): KnowledgeNode[] {
  return nodes.map(node => {
    const layer = determineNodeLayer(node);
    const role = determineNodeRole(node);
    const position = positions.get(node.id) || [0, 0, 0];

    // 根据层级获取配色
    const colors = getColorByLayer(layer);

    // 根据层级确定节点大小
    let size = 0.8;
    if (layer === 'center') {
      size = 2.0; // 中心最大
    } else if (layer === 'core') {
      size = 1.5; // 核心层较大
    } else if (layer === 'tool') {
      size = 1.2; // 工具层中等
    } else {
      size = 0.8; // 资源层较小
    }

    // 根据角色选择形状
    const shape = getShapeByRole(role);

    // 根据角色选择图标
    const icon = getIconByRole(role);

    // 是否发光（核心层和工具层发光）
    const glow = layer === 'core' || layer === 'tool' || layer === 'center';

    return {
      ...node,
      position,
      visual: {
        color: colors.primary,
        size,
        shape,
        glow,
        icon,
      },
      // 保存层级和角色信息（用于调用关系可视化）
      metadata: {
        ...node.metadata,
        layer,
        role,
      },
    };
  });
}

/**
 * 根据角色选择 3D 形状
 */
function getShapeByRole(role: NodeRole): 'sphere' | 'cube' | 'cylinder' | 'octahedron' | 'torus' | 'dodecahedron' | 'cone' | 'box' | 'icosahedron' {
  const shapeMap: Record<NodeRole, any> = {
    claude: 'dodecahedron',    // Claude - 十二面体（复杂中心）
    adapter: 'octahedron',     // Adapter - 八面体（连接器）
    skill: 'cube',             // Skill - 立方体（工具）
    mcp: 'cylinder',           // MCP - 圆柱体（服务器）
    plugin: 'torus',           // Plugin - 圆环（扩展）
    document: 'sphere',        // Document - 球体（知识）
    category: 'octahedron',    // Category - 八面体（分类）
    hook: 'cone',              // Hook - 锥体（拦截器）
    rule: 'box',               // Rule - 方盒（规则）
    agent: 'icosahedron',      // Agent - 二十面体（智能体）
    memory: 'sphere',          // Memory - 球体（记忆）
  };

  return shapeMap[role] || 'sphere';
}

/**
 * 根据角色选择图标
 */
function getIconByRole(role: NodeRole): string {
  const iconMap: Record<NodeRole, string> = {
    claude: '🤖',      // Claude Robot
    adapter: '🔌',     // Adapter
    skill: '⚡',       // Skill
    mcp: '🌐',        // MCP Server
    plugin: '🧩',      // Plugin
    document: '📄',    // Document
    category: '📁',    // Category
    hook: '🪝',        // Hook
    rule: '📋',        // Rule
    agent: '🤖',       // Agent
    memory: '💾',      // Memory
  };

  return iconMap[role] || '📄';
}

/**
 * 创建工程化调用关系连接
 *
 * 调用类型：
 * - invoke: Claude → Adapter (青色实线)
 * - fetch: Adapter → Tool (品红虚线)
 * - provide: Tool → Resource (橙色细线)
 */
export function createEngineeringConnections(
  nodes: KnowledgeNode[]
): Connection[] {
  const connections: Connection[] = [];

  // 找到中心节点 (Claude)
  const centerNode = nodes.find(n => determineNodeLayer(n) === 'center');
  if (!centerNode) return connections;

  // 找到核心层节点 (Adapters)
  const coreNodes = nodes.filter(n => determineNodeLayer(n) === 'core');

  // 找到工具层节点 (Categories)
  const toolNodes = nodes.filter(n => determineNodeLayer(n) === 'tool');

  // 1. Claude → Adapters (invoke - 青色实线)
  for (const adapter of coreNodes) {
    connections.push({
      id: `${centerNode.id}->${adapter.id}`,
      source: centerNode.id,
      target: adapter.id,
      type: 'reference',
      strength: 1.0,
      label: '调用',
      metadata: {
        created: new Date(),
        manual: false,
      },
      visual: {
        color: '#00FFFF',  // 青色
        width: 2,
        dashed: false,
        animated: true,
      },
    });
  }

  // 2. Core → Categories (fetch - 品红虚线)
  // layer-hooks 连接到所有 category
  for (const coreNode of coreNodes) {
    for (const category of toolNodes) {
      connections.push({
        id: `${coreNode.id}->${category.id}`,
        source: coreNode.id,
        target: category.id,
        type: 'dependency',
        strength: 0.7,
        label: '路由',
        metadata: {
          created: new Date(),
          manual: false,
        },
        visual: {
          color: '#FF00FF',  // 品红
          width: 1.5,
          dashed: true,
          animated: false,
        },
      });
    }
  }

  // 3. Categories → Resources (provide - 橙色细线)
  // 这部分连接较多,只在hover时显示
  // 这里先不创建,留到后续Phase 5实现

  return connections;
}
