import { create } from 'zustand';
import type { KnowledgeNode, Connection } from '@/types/knowledge';
import type { ClaudeConfig, ClaudeConfigStats } from '@/types/claude-config';
import { knowledgeBaseService } from '@/services/knowledge-base/KnowledgeBaseService';
import { claudeConfigService } from '@/services/claude/ClaudeConfigService';
import { projectStructureService, ProjectFile } from '@/services/project-structure/ProjectStructureService';
import {
  calculateProjectLayout,
  convertProjectFilesToNodes,
  createDependencyConnections
} from '@/utils/projectLayout';

// 可视化模式
export type VisualizationMode = 'claude-config' | 'project-structure';

interface KnowledgeStore {
  // 数据
  nodes: KnowledgeNode[];
  connections: Connection[];
  selectedNode: KnowledgeNode | null;
  hoveredNode: KnowledgeNode | null;  // 🆕 Hover 状态
  loading: boolean;
  error: string | null;

  // Claude配置
  claudeConfig: ClaudeConfig | null;
  claudeConfigStats: ClaudeConfigStats | null;

  // 🆕 项目结构
  visualizationMode: VisualizationMode;  // 当前可视化模式
  projectFiles: ProjectFile[];           // 项目文件列表

  // UI 状态
  isOpen: boolean;
  searchQuery: string;
  cameraTarget: string | null;
  layoutType: 'force' | 'circular' | 'grid' | 'hierarchical' | 'orbital';  // 🆕 添加 orbital
  enabledNodeTypes: Set<string>;  // 🆕 启用的节点类型（用于过滤）
  cameraZoom: number;  // 🆕 相机缩放级别（1-200）
  cameraReset: boolean;  // 🆕 触发相机重置

  // Actions
  setNodes: (nodes: KnowledgeNode[]) => void;
  setConnections: (connections: Connection[]) => void;
  setSelectedNode: (node: KnowledgeNode | null) => void;
  setHoveredNode: (node: KnowledgeNode | null) => void;  // 🆕 Hover 设置
  setIsOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
  setCameraTarget: (target: string | null) => void;
  setLayoutType: (type: 'force' | 'circular' | 'grid' | 'hierarchical' | 'orbital') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setEnabledNodeTypes: (types: Set<string>) => void;  // 🆕 设置启用的节点类型
  toggleNodeType: (type: string) => void;  // 🆕 切换节点类型
  setCameraZoom: (zoom: number) => void;  // 🆕 设置相机缩放
  triggerCameraReset: () => void;  // 🆕 触发相机重置

  // 添加节点
  addNode: (node: KnowledgeNode) => void;

  // 删除节点
  removeNode: (nodeId: string) => void;

  // 更新节点
  updateNode: (nodeId: string, updates: Partial<KnowledgeNode>) => void;

  // 加载知识库
  loadKnowledgeBase: (rootPath: string) => Promise<void>;

  // 加载Claude配置
  loadClaudeConfig: (rootPath?: string) => Promise<void>;

  // 搜索节点
  searchNodes: (query: string) => KnowledgeNode[];

  // 🆕 切换可视化模式
  setVisualizationMode: (mode: VisualizationMode) => void;

  // 🆕 加载项目结构
  loadProjectStructure: (projectPath: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  // 初始状态 - 移除mock数据，等待自动加载
  nodes: [],
  connections: [],
  selectedNode: null,
  hoveredNode: null,  // 🆕 Hover 初始状态
  loading: false,
  error: null,
  claudeConfig: null,
  claudeConfigStats: null,
  visualizationMode: 'claude-config',  // 🆕 默认显示 Claude 配置
  projectFiles: [],  // 🆕 项目文件列表
  isOpen: true,
  searchQuery: '',
  cameraTarget: null,
  layoutType: 'orbital',  // 🆕 默认使用轨道布局
  enabledNodeTypes: new Set(['claude', 'adapter', 'category', 'skill', 'plugin', 'mcp', 'hook', 'rule', 'agent', 'memory', 'document', 'error']),  // 🆕 默认启用所有类型（包含工程化节点）
  cameraZoom: 100,  // 🆕 默认缩放 100%
  cameraReset: false,  // 🆕 默认不触发重置

  // Actions
  setNodes: (nodes) => set({ nodes }),
  setConnections: (connections) => set({ connections }),
  setSelectedNode: (node) => set({ selectedNode: node, isOpen: node !== null }),
  setHoveredNode: (node) => set({ hoveredNode: node }),  // 🆕 Hover 设置
  setIsOpen: (isOpen) => set({ isOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCameraTarget: (cameraTarget) => set({ cameraTarget }),
  setLayoutType: (layoutType) => set({ layoutType }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setEnabledNodeTypes: (enabledNodeTypes) => set({ enabledNodeTypes }),
  // 🚀 优化版 toggleNodeType - 减少Set创建
  toggleNodeType: (type) =>
    set((state) => {
      // 检查是否需要修改
      const hasType = state.enabledNodeTypes.has(type);

      // 创建新Set并修改
      const newTypes = new Set(state.enabledNodeTypes);
      if (hasType) {
        newTypes.delete(type);
      } else {
        newTypes.add(type);
      }

      // 只有真正发生变化才更新
      return hasType === newTypes.has(type)
        ? state
        : { enabledNodeTypes: newTypes };
    }),
  setCameraZoom: (cameraZoom) => set({ cameraZoom }),
  triggerCameraReset: () => set({ cameraReset: true }, false),  // 触发后立即重置标志

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      connections: state.connections.filter(
        (c) => c.source !== nodeId && c.target !== nodeId
      ),
    })),

  updateNode: (nodeId, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
    })),

  loadKnowledgeBase: async (rootPath: string) => {
    set({ loading: true, error: null });

    try {
      // Step 1: 并行加载Claude配置和.md文档
      await Promise.all([
        claudeConfigService.initialize(rootPath),
        knowledgeBaseService.initialize(rootPath),
      ]);

      // Step 2: 将Claude配置转换为节点
      const { nodes: claudeNodes, connections: claudeConnections } =
        claudeConfigService.convertToNodes();

      // Step 3: 获取文档节点
      const docNodes = knowledgeBaseService.getNodes();
      const docConnections = knowledgeBaseService.getConnections();

      // Step 4: 合并所有节点和连接
      const allNodes = [...claudeNodes, ...docNodes];
      const allConnections = [...claudeConnections, ...docConnections];

      // Step 5: 更新Store
      set({
        nodes: allNodes,
        connections: allConnections,
        loading: false,
      });

      // Step 6: 更新Claude配置统计信息
      const config = claudeConfigService.getConfig();
      const stats = claudeConfigService.getStats();
      set({
        claudeConfig: config,
        claudeConfigStats: stats,
      });

      // Step 7: 设置文件监听（仅监听.md文件变化）
      await knowledgeBaseService.watchDirectory(rootPath, () => {
        const updatedDocNodes = knowledgeBaseService.getNodes();
        const updatedDocConnections = knowledgeBaseService.getConnections();

        // 保留Claude配置节点，更新文档节点
        const { nodes: currentClaudeNodes, connections: currentClaudeConnections } =
          claudeConfigService.convertToNodes();

        set({
          nodes: [...currentClaudeNodes, ...updatedDocNodes],
          connections: [...currentClaudeConnections, ...updatedDocConnections],
        });
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load knowledge base',
        loading: false,
      });
    }
  },

  loadClaudeConfig: async (rootPath?: string) => {
    set({ loading: true, error: null });

    try {
      await claudeConfigService.initialize(rootPath);
      const config = claudeConfigService.getConfig();
      const stats = claudeConfigService.getStats();

      // 🔧 关键修复：转换配置为节点和连接
      const { nodes: claudeNodes, connections: claudeConnections } =
        claudeConfigService.convertToNodes();


      set({
        claudeConfig: config,
        claudeConfigStats: stats,
        nodes: claudeNodes,
        connections: claudeConnections,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load Claude config',
        loading: false,
      });
    }
  },

  // 🚀 优化版搜索 - 使用Map缓存避免重复遍历
  searchNodes: (() => {
    let cache = new Map<string, KnowledgeNode[]>();
    let lastNodesLength = 0;

    return (query: string) => {
      const { nodes } = get();

      // 如果节点数量变化,清空缓存
      if (nodes.length !== lastNodesLength) {
        cache.clear();
        lastNodesLength = nodes.length;
      }

      if (!query.trim()) return nodes;

      // 检查缓存
      const lowerQuery = query.toLowerCase();
      if (cache.has(lowerQuery)) {
        return cache.get(lowerQuery)!;
      }

      // 执行搜索
      const results = nodes.filter(
        (node) =>
          node.title.toLowerCase().includes(lowerQuery) ||
          node.description.toLowerCase().includes(lowerQuery) ||
          node.content.toLowerCase().includes(lowerQuery) ||
          node.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );

      // 缓存结果 (最多缓存100个查询)
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
          cache.delete(firstKey);
        }
      }
      cache.set(lowerQuery, results);

      return results;
    };
  })(),

  // 🆕 切换可视化模式
  setVisualizationMode: (mode: VisualizationMode) => {
    set({ visualizationMode: mode });

    // 根据模式更新启用的节点类型
    if (mode === 'claude-config') {
      set({ enabledNodeTypes: new Set(['claude', 'adapter', 'category', 'skill', 'plugin', 'mcp', 'hook', 'rule', 'agent', 'memory', 'document', 'error']) });
    } else {
      set({
        enabledNodeTypes: new Set([
          'page',
          'api-route',
          'component-scene',
          'component-ui',
          'service',
          'store',
          'util',
          'type-def',
          'folder'
        ])
      });
    }
  },

  // 🆕 加载项目结构 (从 API)
  loadProjectStructure: async (projectPath?: string) => {
    set({ loading: true, error: null });

    try {

      // 调用 API
      const url = (projectPath && projectPath.trim())
        ? `/api/project-structure?projectPath=${encodeURIComponent(projectPath)}`
        : '/api/project-structure';


      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '加载项目结构失败');
      }

      const { files, dependencies } = result.data;

      // 计算布局
      const positions = calculateProjectLayout(files);

      // 转换为节点
      const nodes = convertProjectFilesToNodes(files, positions);

      // 创建连接
      const connections = createDependencyConnections(files);


      // 更新状态
      set({
        nodes,
        connections,
        projectFiles: files,
        loading: false,
        visualizationMode: 'project-structure',
      });

    } catch (error: any) {

      set({
        error: error.message || '加载项目结构失败',
        loading: false,
      });
    }
  },
}));

