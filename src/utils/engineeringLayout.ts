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
  verticalSpread: 0.5,   // Y轴波动幅度
  layerHeight: 3,        // 层间高度差
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

  // 核心层：Adapters
  if (type === 'adapter' || title.includes('adapter')) {
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

    // Y坐标：基础高度 + 正弦波动，形成真实3D层次
    const y = baseHeight + Math.sin(angle * 2) * config.verticalSpread;

    positions.set(node.id, [x, y, z]);
  });
}

/**
 * 布局资源层节点 (具体实例)
 * 使用加权扇区分配 + 多环螺旋分布，避免节点重叠
 */
function layoutResourceNodes(
  nodes: KnowledgeNode[],
  radius: number,
  baseHeight: number,
  config: EngineeringLayoutConfig,
  positions: Map<string, [number, number, number]>
): void {
  if (nodes.length === 0) return;

  // 按类型分组
  const groups: { type: string; nodes: KnowledgeNode[] }[] = [
    { type: 'skill', nodes: nodes.filter(n => n.type === 'skill') },
    { type: 'mcp', nodes: nodes.filter(n => n.type === 'mcp') },
    { type: 'plugin', nodes: nodes.filter(n => n.type === 'plugin') },
    { type: 'hook', nodes: nodes.filter(n => n.type === 'hook') },
    { type: 'rule', nodes: nodes.filter(n => n.type === 'rule') },
    { type: 'agent', nodes: nodes.filter(n => n.type === 'agent') },
    { type: 'memory', nodes: nodes.filter(n => n.type === 'memory') },
    { type: 'document', nodes: nodes.filter(n => n.type === 'document') },
  ];

  // 过滤空组
  const nonEmpty = groups.filter(g => g.nodes.length > 0);
  if (nonEmpty.length === 0) return;

  // 按比例分配角度：节点越多的组获得更大的扇区角度
  // 每个组至少有一个最小角度保证可见性
  const totalNodes = nonEmpty.reduce((sum, g) => sum + g.nodes.length, 0);
  const MIN_SECTOR = Math.PI * 2 * 0.03; // 最小扇区 ~5.4°
  const GAP = 0.04; // 组间间隙弧度
  const totalGap = GAP * nonEmpty.length;
  const availableAngle = Math.PI * 2 - totalGap;
  const minReserved = MIN_SECTOR * nonEmpty.length;
  const distributableAngle = Math.max(0, availableAngle - minReserved);

  let currentAngle = 0;

  for (const group of nonEmpty) {
    const proportion = group.nodes.length / totalNodes;
    const sectorAngle = MIN_SECTOR + distributableAngle * proportion;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sectorAngle;

    layoutGroupMultiRing(group.nodes, radius, startAngle, endAngle, positions, baseHeight);

    currentAngle = endAngle + GAP;
  }
}

/**
 * 多环螺旋布局：在扇区内分配到多个半径环上
 * 确保节点间有足够间距不会重叠
 */
function layoutGroupMultiRing(
  nodes: KnowledgeNode[],
  baseRadius: number,
  startAngle: number,
  endAngle: number,
  positions: Map<string, [number, number, number]>,
  baseHeight: number = 0
): void {
  const count = nodes.length;
  if (count === 0) return;

  const sectorAngle = endAngle - startAngle;
  const NODE_SPACING = 3.0; // 节点间最小弧长间距

  // 计算单环能容纳的节点数
  const arcLength = baseRadius * sectorAngle;
  const nodesPerRing = Math.max(1, Math.floor(arcLength / NODE_SPACING));
  const ringCount = Math.ceil(count / nodesPerRing);

  // 环间距和 Y 偏移
  const RING_RADIAL_GAP = 3.5; // 环间半径差
  const RING_Y_OFFSET = 1.2; // 环间高度差（交替正负）

  nodes.forEach((node, index) => {
    const ringIndex = Math.floor(index / nodesPerRing);
    const posInRing = index % nodesPerRing;
    const countInThisRing = Math.min(nodesPerRing, count - ringIndex * nodesPerRing);

    // 角度：在扇区内均匀分布，内收一点避免贴边
    const padding = sectorAngle * 0.05;
    const usableAngle = sectorAngle - padding * 2;
    const angle = countInThisRing <= 1
      ? startAngle + sectorAngle * 0.5
      : startAngle + padding + (posInRing / (countInThisRing - 1)) * usableAngle;

    // 半径：每一环向外扩展
    const r = baseRadius + ringIndex * RING_RADIAL_GAP;

    // Y：基础高度 + 交替偏移，奇数环上移偶数环下移
    const y = -baseHeight + (ringIndex === 0 ? 0 : ((ringIndex % 2 === 1 ? 1 : -1) * Math.ceil(ringIndex / 2) * RING_Y_OFFSET));

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

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

  // Find resource nodes
  const resourceNodes = nodes.filter(n => determineNodeLayer(n) === 'resource');

  // Category ID mapping for resource types
  const categoryMap: Record<string, string> = {
    skill: 'category-skills',
    mcp: 'category-mcp',
    plugin: 'category-plugins',
    hook: 'category-hooks',
    rule: 'category-rules',
    agent: 'category-agents',
    memory: 'category-memory',
  };

  // 1. Claude → Adapters (invoke - 青色实线，骨架)
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
        color: '#00FFFF',
        width: 3,
        dashed: false,
        animated: true,
        isSkeleton: true,
      },
    });
  }

  // 2. Core → Categories (route - 品红虚线，骨架)
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
          color: '#FF00FF',
          width: 1.5,
          dashed: true,
          animated: false,
          isSkeleton: true,
        },
      });
    }
  }

  // 3. Categories → Resources (provide - 橙色细线，hover only)
  for (const resource of resourceNodes) {
    const categoryId = categoryMap[resource.type];
    if (categoryId) {
      connections.push({
        id: `${categoryId}->${resource.id}`,
        source: categoryId,
        target: resource.id,
        type: 'contains',
        strength: 0.3,
        label: '提供',
        metadata: {
          created: new Date(),
          manual: false,
        },
        visual: {
          color: '#FFA500',
          width: 0.5,
          dashed: false,
          animated: false,
          isSkeleton: false,
        },
      });
    }
  }

  return connections;
}
