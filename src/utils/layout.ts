import * as d3Force from 'd3-force-3d';
import type { KnowledgeNode, Connection } from '@/types/knowledge';
import {
  calculateEngineeringLayout,
  applyEngineeringStyles,
  createEngineeringConnections,
} from './engineeringLayout';

export interface LayoutResult {
  nodes: KnowledgeNode[];
  nodeMap: Record<string, KnowledgeNode>;
}

export interface ForceLayoutOptions {
  attraction?: number;
  repulsion?: number;
  iterations?: number;
  centerStrength?: number;
  collisionRadius?: number;
}

const DEFAULT_OPTIONS: Required<ForceLayoutOptions> = {
  attraction: 0.05,
  repulsion: 300,
  iterations: 300,
  centerStrength: 0.05,
  collisionRadius: 2,
};

/**
 * 放射状布局 - Vibecraft 风格
 * 🔄 全部落在水平面上，提高3D空间可读性
 */
export function computeRadialLayout(
  nodes: KnowledgeNode[],
  radius: number = 15,
  layers: number = 3
): LayoutResult {
  const resultNodes: KnowledgeNode[] = [];
  const nodesPerLayer = Math.ceil(nodes.length / layers);

  nodes.forEach((node, index) => {
    // 确定当前节点所在的层
    const layer = Math.floor(index / nodesPerLayer) + 1;
    const indexInLayer = index % nodesPerLayer;
    const totalInLayer = Math.min(nodesPerLayer, nodes.length - (layer - 1) * nodesPerLayer);

    // 计算角度和距离
    const angle = (indexInLayer / totalInLayer) * Math.PI * 2;
    const distance = radius * layer;

    // 计算位置，添加一些随机变化使其更自然
    const randomOffset = Math.random() * 2 - 1;
    const x = Math.cos(angle) * distance + randomOffset;
    const z = Math.sin(angle) * distance + randomOffset;
    const y = 0; // 🔄 固定Y=0，全部落在水平面上

    resultNodes.push({
      ...node,
      position: [x, y, z] as [number, number, number],
    });
  });

  const nodeMap = resultNodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, KnowledgeNode>);

  return {
    nodes: resultNodes,
    nodeMap,
  };
}

/**
 * 球形布局 - 🔄 改为圆形水平布局（全部落在Y=0平面）
 */
export function computeSphereLayout(
  nodes: KnowledgeNode[],
  radius: number = 20
): LayoutResult {
  const resultNodes = nodes.map((node, index) => {
    // 🔄 使用圆形布局代替球形，全部落在水平面上
    const angle = (index / nodes.length) * Math.PI * 2;

    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = 0; // 🔄 固定Y=0

    return {
      ...node,
      position: [x, y, z] as [number, number, number],
    };
  });

  const nodeMap = resultNodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, KnowledgeNode>);

  return {
    nodes: resultNodes,
    nodeMap,
  };
}

/**
 * 螺旋布局 - 🔄 改为水平螺旋（全部落在Y=0平面）
 */
export function computeSpiralLayout(
  nodes: KnowledgeNode[],
  spacing: number = 3
): LayoutResult {
  const resultNodes = nodes.map((node, index) => {
    const angle = index * 0.5; // 螺旋角度
    const radius = 10 + index * 0.8; // 半径逐渐增大

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0; // 🔄 固定Y=0，全部落在水平面上

    return {
      ...node,
      position: [x, y, z] as [number, number, number],
    };
  });

  const nodeMap = resultNodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, KnowledgeNode>);

  return {
    nodes: resultNodes,
    nodeMap,
  };
}

export function computeForceDirectedLayout(
  nodes: KnowledgeNode[],
  connections: Connection[],
  options: ForceLayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 创建副本避免修改原数据
  const nodesCopy = nodes.map((n) => ({ ...n }));

  // 创建 D3 图数据结构
  const graph = {
    nodes: nodesCopy.map((n) => ({
      ...n,
      x: n.position[0] || Math.random() * 20 - 10,
      y: n.position[1] || Math.random() * 20 - 10,
      z: n.position[2] || Math.random() * 20 - 10,
    })),
    links: connections.map((c) => ({
      source: c.source,
      target: c.target,
      strength: c.strength,
    })),
  };

  // 创建力模拟
  const simulation = d3Force
    .forceSimulation(graph.nodes)
    .force(
      'link',
      d3Force
        .forceLink(graph.links)
        .id((d: any) => d.id)
        .distance(10)
        .strength(opts.attraction)
    )
    .force('charge', d3Force.forceManyBody().strength(-opts.repulsion))
    .force('center', d3Force.forceCenter(0, 0, 0).strength(opts.centerStrength))
    .force(
      'collision',
      d3Force.forceCollide().radius((d: any) => d.visual.size * opts.collisionRadius)
    )
    .stop();

  // 运行模拟
  for (let i = 0; i < opts.iterations; i++) {
    simulation.tick();
  }

  // 更新节点位置
  const resultNodes = nodesCopy.map((node) => {
    const d3Node = graph.nodes.find((n) => n.id === node.id);
    if (d3Node) {
      return {
        ...node,
        position: [
          d3Node.x || 0,
          d3Node.y || 0,
          d3Node.z || 0,
        ] as [number, number, number],
      };
    }
    return node;
  });

  // 创建节点映射
  const nodeMap = resultNodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, KnowledgeNode>);

  return {
    nodes: resultNodes,
    nodeMap,
  };
}

export function computeCircularLayout(
  nodes: KnowledgeNode[],
  radius: number = 10
): LayoutResult {
  const resultNodes = nodes.map((node, index) => {
    const angle = (index / nodes.length) * Math.PI * 2;
    return {
      ...node,
      position: [
        Math.cos(angle) * radius,
        0, // 🔄 固定Y=0，全部落在水平面上
        Math.sin(angle) * radius,
      ] as [number, number, number],
    };
  });

  const nodeMap = resultNodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, KnowledgeNode>);

  return {
    nodes: resultNodes,
    nodeMap,
  };
}

export function computeGridLayout(
  nodes: KnowledgeNode[],
  spacing: number = 5
): LayoutResult {
  const gridSize = Math.ceil(Math.sqrt(nodes.length));

  const resultNodes = nodes.map((node, index) => {
    const x = (index % gridSize) * spacing - (gridSize * spacing) / 2;
    const z = Math.floor(index / gridSize) * spacing - (gridSize * spacing) / 2;
    return {
      ...node,
      position: [x, 0, z] as [number, number, number],
    };
  });

  const nodeMap = resultNodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, KnowledgeNode>);

  return {
    nodes: resultNodes,
    nodeMap,
  };
}

/**
 * 轨道布局 - Claude Engineering Galaxy 核心布局
 * 3 层轨道系统，每层有不同的半径和旋转速度
 */
export interface OrbitDefinition {
  id: number;           // 轨道编号 (1, 2, 3)
  radius: number;       // 轨道半径
  maxNodes?: number;    // 最大节点数（可选）
  speed: number;        // 旋转速度
  opacity: number;      // 透明度
}

export const ORBIT_DEFINITIONS: OrbitDefinition[] = [
  {
    id: 1,
    radius: 17.5,        // 第一轨道（核心技能）
    maxNodes: 12,
    speed: 0.1,          // 慢速旋转
    opacity: 1.0,
  },
  {
    id: 2,
    radius: 30,          // 第二轨道（技能模块）
    maxNodes: 24,
    speed: 0.3,          // 中速旋转
    opacity: 0.9,
  },
  {
    id: 3,
    radius: 47.5,        // 第三轨道（项目/实例）
    speed: 0.5,          // 快速旋转
    opacity: 0.7,
  },
];

/**
 * 将节点分类到不同轨道
 */
function classifyNodeToOrbit(node: KnowledgeNode): number {
  // Category 节点在第一轨道
  if (node.type === 'category') {
    return 1;
  }

  // Skill 节点在第二轨道
  if (node.type === 'skill') {
    return 2;
  }

  // MCP 服务器在第二轨道
  if (node.type === 'mcp') {
    return 2;
  }

  // Plugin 在第三轨道
  if (node.type === 'plugin') {
    return 3;
  }

  // 默认第三轨道
  return 3;
}

export interface OrbitalLayoutResult extends LayoutResult {
  orbits: {
    orbit: OrbitDefinition;
    nodes: KnowledgeNode[];
  }[];
  connections?: Connection[]; // 工程化调用关系连接
}

export function computeOrbitalLayout(
  nodes: KnowledgeNode[],
  connections: Connection[]
): OrbitalLayoutResult {
  // 🆕 使用工程化3层轨道布局系统

  // 1. 计算工程化布局位置
  const positions = calculateEngineeringLayout(nodes);

  // 2. 应用工程化样式和配色
  const styledNodes = applyEngineeringStyles(nodes, positions);

  // 3. 将节点按层级分组（用于统计信息）
  const orbitNodes: Map<number, KnowledgeNode[]> = new Map();
  ORBIT_DEFINITIONS.forEach((orbit) => orbitNodes.set(orbit.id, []));

  styledNodes.forEach((node) => {
    const orbitId = classifyNodeToOrbit(node);
    orbitNodes.get(orbitId)?.push(node);
  });

  // 4. 创建轨道信息
  const orbitsInfo: OrbitalLayoutResult['orbits'] = [];
  ORBIT_DEFINITIONS.forEach((orbit) => {
    const nodesInOrbit = orbitNodes.get(orbit.id) || [];
    orbitsInfo.push({
      orbit,
      nodes: nodesInOrbit,
    });
  });

  // 5. 创建节点映射
  const nodeMap = styledNodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, KnowledgeNode>);

  // 6. 创建工程化调用关系连接 (Phase 5)
  const engineeringConnections = createEngineeringConnections(styledNodes);

  // 7. 合并原有连接和工程化连接
  const allConnections = [...connections, ...engineeringConnections];

  orbitsInfo.forEach(({ orbit, nodes }) => {
  });

  return {
    nodes: styledNodes,
    nodeMap,
    orbits: orbitsInfo,
    connections: allConnections, // 返回包含工程化连接的完整连接列表
  };
}

export function computeHierarchicalLayout(
  nodes: KnowledgeNode[],
  connections: Connection[],
  levelSpacing: number = 10,
  nodeSpacing: number = 5
): LayoutResult {
  // 构建邻接表
  const adjacency = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();

  nodes.forEach((n) => {
    adjacency.set(n.id, new Set());
    inDegree.set(n.id, 0);
  });

  connections.forEach((c) => {
    adjacency.get(c.source)?.add(c.target);
    inDegree.set(c.target, (inDegree.get(c.target) || 0) + 1);
  });

  // 拓扑排序确定层级
  const levels: string[][] = [];
  const queue: string[] = [];

  // 找到所有根节点（入度为 0）
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  if (queue.length === 0 && nodes.length > 0) {
    // 如果没有根节点，选择第一个节点
    queue.push(nodes[0].id);
  }

  while (queue.length > 0) {
    const currentLevel: string[] = [...queue];
    levels.push(currentLevel);
    queue.length = 0;

    currentLevel.forEach((id) => {
      const neighbors = adjacency.get(id);
      neighbors?.forEach((neighborId) => {
        const newDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newDegree);
        if (newDegree === 0) {
          queue.push(neighborId);
        }
      });
    });
  }

  // 处理剩余节点（循环引用的情况）
  const processedIds = new Set(levels.flat());
  const remainingNodes = nodes.filter((n) => !processedIds.has(n.id));
  if (remainingNodes.length > 0) {
    levels.push(remainingNodes.map((n) => n.id));
  }

  // 分配位置
  const resultNodes = nodes.map((node) => {
    let levelIndex = 0;
    let positionInLevel = 0;

    for (let i = 0; i < levels.length; i++) {
      const idx = levels[i].indexOf(node.id);
      if (idx !== -1) {
        levelIndex = i;
        positionInLevel = idx;
        break;
      }
    }

    const levelWidth = levels[levelIndex].length;
    const x = (positionInLevel - levelWidth / 2) * nodeSpacing;
    const y = 0; // 🔄 固定Y=0，全部落在水平面上
    const z = -levelIndex * levelSpacing; // 🔄 层级改用Z轴展示

    return {
      ...node,
      position: [x, y, z] as [number, number, number],
    };
  });

  const nodeMap = resultNodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, KnowledgeNode>);

  return {
    nodes: resultNodes,
    nodeMap,
  };
}
