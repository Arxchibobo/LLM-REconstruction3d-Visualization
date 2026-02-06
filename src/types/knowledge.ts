export type NodeType =
  // Claude 核心
  | 'claude'          // Claude Code 中心节点
  | 'adapter'         // 适配器节点

  // Claude 配置相关
  | 'document'
  | 'category'
  | 'error'
  | 'mcp'
  | 'skill'
  | 'plugin'
  | 'config'

  // 新增：工程化组件
  | 'hook'            // Hook 钩子
  | 'rule'            // 规则文件
  | 'agent'           // Agent 定义
  | 'memory'          // 学习/记忆/缓存

  // 项目结构相关
  | 'page'            // Next.js 页面 (page.tsx, layout.tsx)
  | 'api-route'       // API 路由
  | 'component-scene' // 3D 场景组件
  | 'component-ui'    // UI 组件
  | 'service'         // 服务层
  | 'store'           // 状态管理 (Zustand)
  | 'util'            // 工具函数
  | 'type-def'        // 类型定义
  | 'folder';         // 文件夹

export type ShapeType =
  | 'sphere'
  | 'cube'
  | 'cylinder'
  | 'octahedron'
  | 'torus'
  | 'dodecahedron'
  | 'icosahedron'     // 新增：20面体
  | 'cone'            // 新增：圆锥
  | 'box';            // 新增：盒子

export type ConnectionType =
  // Claude 配置相关
  | 'reference'
  | 'dependency'
  | 'related'
  | 'cross-reference'
  | 'parent-child'
  | 'cause-effect'
  // 工程化流程
  | 'intercept'       // Hook 拦截
  | 'route'           // 路由分发
  | 'invoke'          // 调用
  // 项目结构相关
  | 'import'          // 导入依赖 (A imports B)
  | 'export'          // 导出依赖 (A exports to B)
  | 'contains';       // 包含关系 (文件夹包含文件)

// 节点层级定义
export type NodeTier = 'CoreSkill' | 'Skill' | 'Item';

// 轨道编号
export type OrbitNumber = 1 | 2 | 3;

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  filePath: string;
  content: string;
  tags: string[];
  links: string[];
  position: [number, number, number];

  // 层级和轨道信息
  tier?: NodeTier;
  orbit?: OrbitNumber;

  metadata: {
    size: number;
    created: Date;
    modified: Date;
    accessed: Date;
    accessCount: number;
    importance: number;
  };
  visual: {
    color: string;
    size: number;
    shape: ShapeType;
    glow: boolean;
    icon: string;
  };
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  type: ConnectionType;
  strength: number;
  label?: string;
  metadata: {
    created: Date;
    manual: boolean;
  };
  visual: {
    color: string;
    width: number;
    dashed: boolean;
    animated: boolean;
    isSkeleton?: boolean; // 是否为骨架连接（核心路由）
  };
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  connections: Connection[];
  metadata: {
    version: string;
    lastUpdated: Date;
    totalSize: number;
    fileCount: number;
  };
}

// 节点类型配色映射
export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  // Claude 核心
  claude: '#0066ff',
  adapter: '#00FFFF',

  // Claude 配置
  document: '#3B82F6',
  category: '#8B5CF6',
  error: '#EF4444',
  mcp: '#06B6D4',
  skill: '#10B981',
  plugin: '#F59E0B',
  config: '#6366F1',

  // 工程化组件
  hook: '#EF4444',
  rule: '#8B5CF6',
  agent: '#EC4899',
  memory: '#14B8A6',

  // 项目结构
  page: '#3B82F6',
  'api-route': '#F97316',
  'component-scene': '#8B5CF6',
  'component-ui': '#EC4899',
  service: '#10B981',
  store: '#F59E0B',
  util: '#6366F1',
  'type-def': '#64748B',
  folder: '#94A3B8',
};

// 节点类型形状映射
export const NODE_TYPE_SHAPES: Record<NodeType, ShapeType> = {
  // Claude 核心
  claude: 'sphere',
  adapter: 'octahedron',

  // Claude 配置
  document: 'cube',
  category: 'cube',
  error: 'octahedron',
  mcp: 'cylinder',
  skill: 'torus',
  plugin: 'dodecahedron',
  config: 'cube',

  // 工程化组件
  hook: 'cone',
  rule: 'box',
  agent: 'icosahedron',
  memory: 'sphere',

  // 项目结构
  page: 'cube',
  'api-route': 'cylinder',
  'component-scene': 'sphere',
  'component-ui': 'dodecahedron',
  service: 'octahedron',
  store: 'torus',
  util: 'cube',
  'type-def': 'octahedron',
  folder: 'cube',
};
