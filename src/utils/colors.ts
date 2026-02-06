/**
 * Claude Engineering Galaxy · 语义颜色系统
 *
 * 禁止随机颜色，所有颜色必须有语义
 *
 * 新增：赛博朋克风格层级配色系统
 * - 深蓝黑背景 + 霓虹色强调
 * - 3层轨道布局：核心层(青) → 工具层(品红) → 资源层(橙)
 */

export interface SemanticColor {
  primary: string;      // 主色
  secondary: string;    // 辅助色
  glow: string;         // 发光色
  opacity?: number;     // 透明度（可选）
}

/**
 * 赛博朋克风格层级配色
 * 用于3D可视化的3层轨道系统
 */
export const CYBERPUNK_LAYER_COLORS = {
  // 背景色系
  background: {
    primary: '#0A1929',     // 深蓝黑背景
    secondary: '#0F172A',   // 次级深色背景
    accent: '#1E293B',      // 强调深色（边框等）
  },

  // 核心层 (第1轨道: Adapters)
  coreLayer: {
    primary: '#00FFFF',     // 青色 - 核心适配器
    secondary: '#00BCD4',   // 深青
    glow: '#80FFFF',        // 发光青
    shadow: '#00FFFF40',    // 阴影色（带透明度）
  },

  // 工具层 (第2轨道: Skills/MCP/Plugins)
  toolLayer: {
    primary: '#FF00FF',     // 品红 - 工具和服务
    secondary: '#C20084',   // 深品红
    glow: '#FF80FF',        // 发光品红
    shadow: '#FF00FF40',    // 阴影色（带透明度）
  },

  // 资源层 (第3轨道: 具体实例)
  resourceLayer: {
    primary: '#FFA500',     // 橙色 - 资源实例
    secondary: '#FF8C00',   // 深橙
    glow: '#FFD280',        // 发光橙
    shadow: '#FFA50040',    // 阴影色（带透明度）
  },

  // 连接线配色（表示调用关系）
  connections: {
    invoke: '#00FFFF',      // 青色 - 调用关系（实线）
    fetch: '#FF00FF',       // 品红 - 获取数据（虚线）
    provide: '#FFA500',     // 橙色 - 提供资源（细线）
    default: '#808080',     // 灰色 - 默认连接
  },

  // 文本颜色
  text: {
    primary: '#FFFFFF',     // 纯白 - 主要文本
    secondary: '#D1D5DB',   // 浅灰 - 次要文本
    tertiary: '#9CA3AF',    // 中灰 - 辅助文本
    accent: '#00FFFF',      // 青色 - 强调文本
  },
};

/**
 * 语义颜色常量
 * 每种类型都有明确的颜色含义
 */
export const SEMANTIC_COLORS: Record<string, SemanticColor> = {
  // Prompt / LLM / AI
  llm: {
    primary: '#5B8EFF',      // Blue - 智能、思考
    secondary: '#4A5FC1',    // Indigo - 深度
    glow: '#7AA2FF',
  },

  // Infra / Tooling / DevOps
  infra: {
    primary: '#00FFFF',      // Cyan - 技术、工具
    secondary: '#00BFA5',    // Teal - 系统
    glow: '#4DD0E1',
  },

  // Review / QA / Testing
  review: {
    primary: '#FFB74D',      // Amber - 检查、警告
    secondary: '#FFA726',    // Orange - 审查
    glow: '#FFCC80',
  },

  // Automation / Workflow
  automation: {
    primary: '#AB47BC',      // Purple - 自动化、流程
    secondary: '#8E24AA',    // Deep Purple
    glow: '#CE93D8',
  },

  // Security / Protection
  security: {
    primary: '#EF5350',      // Red - 安全、防护
    secondary: '#E53935',    // Deep Red
    glow: '#FF8A80',
  },

  // Documentation / Knowledge
  documentation: {
    primary: '#66BB6A',      // Green - 知识、文档
    secondary: '#4CAF50',    // Medium Green
    glow: '#A5D6A7',
  },

  // Frontend / UI
  frontend: {
    primary: '#EC407A',      // Pink - 界面、视觉
    secondary: '#D81B60',    // Deep Pink
    glow: '#F8BBD0',
  },

  // Backend / API
  backend: {
    primary: '#42A5F5',      // Light Blue - 后端、服务
    secondary: '#1E88E5',    // Medium Blue
    glow: '#90CAF9',
  },

  // Data / Analytics
  data: {
    primary: '#26A69A',      // Teal - 数据、分析
    secondary: '#00897B',    // Dark Teal
    glow: '#80CBC4',
  },

  // Experimental / Beta
  experimental: {
    primary: '#78909C',      // Gray - 实验、未成熟
    secondary: '#546E7A',    // Blue Gray
    glow: '#90A4AE',
    opacity: 0.6,            // 低透明度表示不稳定
  },

  // Plugin / Extension
  plugin: {
    primary: '#FFA726',      // Orange - 插件、扩展
    secondary: '#FF9800',    // Dark Orange
    glow: '#FFCC80',
  },

  // Skill / Capability
  skill: {
    primary: '#7E57C2',      // Deep Purple - 技能、能力
    secondary: '#5E35B1',    // Deeper Purple
    glow: '#B39DDB',
  },

  // MCP / Server
  mcp: {
    primary: '#29B6F6',      // Light Blue - 服务、连接
    secondary: '#039BE5',    // Sky Blue
    glow: '#81D4FA',
  },

  // Category / Group
  category: {
    primary: '#00FFFF',      // Cyan - 分类、组织
    secondary: '#00BCD4',    // Cyan Dark
    glow: '#80DEEA',
  },

  // Claude Core (中心节点)
  claude: {
    primary: '#0066FF',      // Electric Blue - Claude 核心
    secondary: '#0044CC',    // Deep Blue
    glow: '#4499FF',
  },

  // Adapter (适配器)
  adapter: {
    primary: '#00FFFF',      // Cyan - 适配器节点
    secondary: '#00BFA5',    // Teal
    glow: '#4DD0E1',
  },

  // Hook (钩子)
  hook: {
    primary: '#EF4444',      // Red - 钩子拦截
    secondary: '#DC2626',    // Dark Red
    glow: '#F87171',
  },

  // Rule (规则)
  rule: {
    primary: '#8B5CF6',      // Purple - 规则定义
    secondary: '#7C3AED',    // Deeper Purple
    glow: '#A78BFA',
  },

  // Agent (代理)
  agent: {
    primary: '#EC4899',      // Pink - Agent 智能体
    secondary: '#DB2777',    // Deep Pink
    glow: '#F472B6',
  },

  // Memory (记忆)
  memory: {
    primary: '#14B8A6',      // Teal - 记忆/缓存
    secondary: '#0D9488',    // Dark Teal
    glow: '#2DD4BF',
  },

  // Default / Unknown
  default: {
    primary: '#9E9E9E',      // Gray - 未分类
    secondary: '#757575',    // Dark Gray
    glow: '#BDBDBD',
  },

  // ========== 项目结构相关颜色 ==========

  // Page / Route
  page: {
    primary: '#2196F3',      // Bright Blue - 页面入口
    secondary: '#1976D2',    // Medium Blue
    glow: '#64B5F6',
  },

  // API Route
  'api-route': {
    primary: '#4CAF50',      // Green - API 端点
    secondary: '#388E3C',    // Dark Green
    glow: '#81C784',
  },

  // Scene Component
  'component-scene': {
    primary: '#9C27B0',      // Purple - 3D 场景
    secondary: '#7B1FA2',    // Deep Purple
    glow: '#BA68C8',
  },

  // UI Component
  'component-ui': {
    primary: '#E91E63',      // Pink - UI 组件
    secondary: '#C2185B',    // Deep Pink
    glow: '#F06292',
  },

  // Service Layer
  service: {
    primary: '#FF9800',      // Orange - 服务层
    secondary: '#F57C00',    // Dark Orange
    glow: '#FFB74D',
  },

  // State Store
  store: {
    primary: '#F44336',      // Red - 状态管理(最重要)
    secondary: '#D32F2F',    // Deep Red
    glow: '#EF5350',
  },

  // Utility
  util: {
    primary: '#FFEB3B',      // Yellow - 工具函数
    secondary: '#FBC02D',    // Dark Yellow
    glow: '#FFF176',
  },

  // Type Definition
  'type-def': {
    primary: '#607D8B',      // Blue Gray - 类型定义
    secondary: '#455A64',    // Dark Blue Gray
    glow: '#78909C',
  },

  // Folder
  folder: {
    primary: '#BDBDBD',      // Light Gray - 文件夹
    secondary: '#9E9E9E',    // Gray
    glow: '#E0E0E0',
    opacity: 0.7,            // 半透明
  },
};

/**
 * 根据节点类型获取语义颜色
 */
export function getColorByType(type?: string): SemanticColor {
  if (!type) return SEMANTIC_COLORS.default;

  const lowerType = type.toLowerCase();

  // 精确匹配
  if (SEMANTIC_COLORS[lowerType]) {
    return SEMANTIC_COLORS[lowerType];
  }

  // 模糊匹配
  if (lowerType.includes('llm') || lowerType.includes('prompt') || lowerType.includes('ai')) {
    return SEMANTIC_COLORS.llm;
  }
  if (lowerType.includes('infra') || lowerType.includes('tool') || lowerType.includes('devops')) {
    return SEMANTIC_COLORS.infra;
  }
  if (lowerType.includes('review') || lowerType.includes('qa') || lowerType.includes('test')) {
    return SEMANTIC_COLORS.review;
  }
  if (lowerType.includes('automat') || lowerType.includes('workflow') || lowerType.includes('cicd')) {
    return SEMANTIC_COLORS.automation;
  }
  if (lowerType.includes('security') || lowerType.includes('audit') || lowerType.includes('scan')) {
    return SEMANTIC_COLORS.security;
  }
  if (lowerType.includes('doc') || lowerType.includes('knowledge') || lowerType.includes('guide')) {
    return SEMANTIC_COLORS.documentation;
  }
  if (lowerType.includes('frontend') || lowerType.includes('ui') || lowerType.includes('react')) {
    return SEMANTIC_COLORS.frontend;
  }
  if (lowerType.includes('backend') || lowerType.includes('api') || lowerType.includes('server')) {
    return SEMANTIC_COLORS.backend;
  }
  if (lowerType.includes('data') || lowerType.includes('analytics') || lowerType.includes('database')) {
    return SEMANTIC_COLORS.data;
  }
  if (lowerType.includes('experiment') || lowerType.includes('beta') || lowerType.includes('draft')) {
    return SEMANTIC_COLORS.experimental;
  }
  if (lowerType.includes('plugin')) {
    return SEMANTIC_COLORS.plugin;
  }
  if (lowerType.includes('skill')) {
    return SEMANTIC_COLORS.skill;
  }
  if (lowerType.includes('mcp')) {
    return SEMANTIC_COLORS.mcp;
  }
  if (lowerType.includes('category')) {
    return SEMANTIC_COLORS.category;
  }
  if (lowerType === 'claude') {
    return SEMANTIC_COLORS.claude;
  }
  if (lowerType === 'adapter') {
    return SEMANTIC_COLORS.adapter;
  }
  if (lowerType === 'hook') {
    return SEMANTIC_COLORS.hook;
  }
  if (lowerType === 'rule') {
    return SEMANTIC_COLORS.rule;
  }
  if (lowerType === 'agent') {
    return SEMANTIC_COLORS.agent;
  }
  if (lowerType === 'memory') {
    return SEMANTIC_COLORS.memory;
  }

  // 项目结构类型
  if (lowerType === 'page') {
    return SEMANTIC_COLORS.page;
  }
  if (lowerType === 'api-route') {
    return SEMANTIC_COLORS['api-route'];
  }
  if (lowerType === 'component-scene') {
    return SEMANTIC_COLORS['component-scene'];
  }
  if (lowerType === 'component-ui') {
    return SEMANTIC_COLORS['component-ui'];
  }
  if (lowerType === 'service') {
    return SEMANTIC_COLORS.service;
  }
  if (lowerType === 'store') {
    return SEMANTIC_COLORS.store;
  }
  if (lowerType === 'util') {
    return SEMANTIC_COLORS.util;
  }
  if (lowerType === 'type-def') {
    return SEMANTIC_COLORS['type-def'];
  }
  if (lowerType === 'folder') {
    return SEMANTIC_COLORS.folder;
  }

  return SEMANTIC_COLORS.default;
}

/**
 * 根据节点名称获取语义颜色（备用方案）
 */
export function getColorByName(name?: string): SemanticColor {
  if (!name) return SEMANTIC_COLORS.default;

  const lowerName = name.toLowerCase();

  // 分析名称中的关键词
  if (lowerName.includes('prompt') || lowerName.includes('llm')) {
    return SEMANTIC_COLORS.llm;
  }
  if (lowerName.includes('deploy') || lowerName.includes('infra')) {
    return SEMANTIC_COLORS.infra;
  }
  if (lowerName.includes('review') || lowerName.includes('test')) {
    return SEMANTIC_COLORS.review;
  }
  if (lowerName.includes('auto') || lowerName.includes('ci')) {
    return SEMANTIC_COLORS.automation;
  }
  if (lowerName.includes('security') || lowerName.includes('auth')) {
    return SEMANTIC_COLORS.security;
  }
  if (lowerName.includes('doc') || lowerName.includes('guide')) {
    return SEMANTIC_COLORS.documentation;
  }
  if (lowerName.includes('frontend') || lowerName.includes('ui')) {
    return SEMANTIC_COLORS.frontend;
  }
  if (lowerName.includes('backend') || lowerName.includes('api')) {
    return SEMANTIC_COLORS.backend;
  }
  if (lowerName.includes('data') || lowerName.includes('sql')) {
    return SEMANTIC_COLORS.data;
  }

  return SEMANTIC_COLORS.default;
}

/**
 * 根据节点类别获取语义颜色
 */
export function getColorByCategory(category?: string): SemanticColor {
  if (!category) return SEMANTIC_COLORS.default;

  // Category 节点统一使用 cyan
  if (category === 'category') {
    return SEMANTIC_COLORS.category;
  }

  // 其他按类型匹配
  return getColorByType(category);
}

/**
 * 混合两个颜色（用于渐变）
 */
export function blendColors(color1: string, color2: string, ratio: number): string {
  // 简单的颜色混合（可以用更复杂的算法）
  // 这里返回其中一个颜色（可以后续优化）
  return ratio < 0.5 ? color1 : color2;
}

/**
 * 调整颜色亮度
 */
export function adjustBrightness(color: string, amount: number): string {
  // 将十六进制转为 RGB，调整亮度后再转回
  // 简化版本，返回原色（可以后续优化）
  return color;
}

/**
 * 获取节点的完整颜色方案（包括 hover 和 selected 状态）
 */
export interface ColorScheme extends SemanticColor {
  hover: string;     // hover 时的颜色
  selected: string;  // 选中时的颜色
  dim: string;       // dim 时的颜色
}

export function getFullColorScheme(type?: string): ColorScheme {
  const base = getColorByType(type);

  return {
    ...base,
    hover: base.glow,              // hover 时使用 glow 颜色
    selected: base.secondary,      // 选中时使用 secondary
    dim: base.primary,             // dim 时保持 primary 但降低透明度
  };
}

/**
 * 根据节点层级获取赛博朋克配色
 * @param layer - 节点所在层级: 'core' | 'tool' | 'resource'
 * @returns 该层级的配色方案
 */
export function getColorByLayer(layer: 'core' | 'tool' | 'resource' | string): SemanticColor {
  switch (layer) {
    case 'core':
      return {
        primary: CYBERPUNK_LAYER_COLORS.coreLayer.primary,
        secondary: CYBERPUNK_LAYER_COLORS.coreLayer.secondary,
        glow: CYBERPUNK_LAYER_COLORS.coreLayer.glow,
      };
    case 'tool':
      return {
        primary: CYBERPUNK_LAYER_COLORS.toolLayer.primary,
        secondary: CYBERPUNK_LAYER_COLORS.toolLayer.secondary,
        glow: CYBERPUNK_LAYER_COLORS.toolLayer.glow,
      };
    case 'resource':
      return {
        primary: CYBERPUNK_LAYER_COLORS.resourceLayer.primary,
        secondary: CYBERPUNK_LAYER_COLORS.resourceLayer.secondary,
        glow: CYBERPUNK_LAYER_COLORS.resourceLayer.glow,
      };
    default:
      // 默认返回工具层配色
      return {
        primary: CYBERPUNK_LAYER_COLORS.toolLayer.primary,
        secondary: CYBERPUNK_LAYER_COLORS.toolLayer.secondary,
        glow: CYBERPUNK_LAYER_COLORS.toolLayer.glow,
      };
  }
}

/**
 * 根据调用类型获取连接线颜色
 * @param callType - 调用类型: 'invoke' | 'fetch' | 'provide'
 * @returns 连接线的颜色
 */
export function getConnectionColor(callType: 'invoke' | 'fetch' | 'provide' | string): string {
  switch (callType) {
    case 'invoke':
      return CYBERPUNK_LAYER_COLORS.connections.invoke;
    case 'fetch':
      return CYBERPUNK_LAYER_COLORS.connections.fetch;
    case 'provide':
      return CYBERPUNK_LAYER_COLORS.connections.provide;
    default:
      return CYBERPUNK_LAYER_COLORS.connections.default;
  }
}
