import { create } from 'zustand';
import type { KnowledgeNode, Connection } from '@/types/knowledge';
import type { ClaudeConfig, ClaudeConfigStats } from '@/types/claude-config';
import { knowledgeBaseService } from '@/services/knowledge-base/KnowledgeBaseService';
import { claudeConfigService } from '@/services/claude/ClaudeConfigService';

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
  isOpen: true,
  searchQuery: '',
  cameraTarget: null,
  layoutType: 'orbital',  // 🆕 默认使用轨道布局
  enabledNodeTypes: new Set(['skill', 'plugin', 'mcp', 'document', 'error']),  // 🆕 默认启用所有类型
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
  toggleNodeType: (type) =>
    set((state) => {
      const newTypes = new Set(state.enabledNodeTypes);
      if (newTypes.has(type)) {
        newTypes.delete(type);
      } else {
        newTypes.add(type);
      }
      return { enabledNodeTypes: newTypes };
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

      console.log(
        `Loaded ${allNodes.length} total nodes (${claudeNodes.length} Claude + ${docNodes.length} docs)`
      );

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
      console.error('Failed to load knowledge base:', error);
      set({
        error: error.message || 'Failed to load knowledge base',
        loading: false,
      });
    }
  },

  loadClaudeConfig: async (rootPath?: string) => {
    try {
      await claudeConfigService.initialize(rootPath);
      const config = claudeConfigService.getConfig();
      const stats = claudeConfigService.getStats();

      set({
        claudeConfig: config,
        claudeConfigStats: stats,
      });

      console.log('Claude配置已加载:', stats);
    } catch (error: any) {
      console.error('加载Claude配置失败:', error);
      // 不中断主流程，使用mock数据
    }
  },

  searchNodes: (query: string) => {
    const { nodes } = get();
    if (!query.trim()) return nodes;

    const lowerQuery = query.toLowerCase();
    return nodes.filter(
      (node) =>
        node.title.toLowerCase().includes(lowerQuery) ||
        node.description.toLowerCase().includes(lowerQuery) ||
        node.content.toLowerCase().includes(lowerQuery) ||
        node.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  },
}));

// 生成模拟数据（临时，用于演示）
function generateMockNodes(): KnowledgeNode[] {
  const nodeTypes: Array<{
    type: 'document' | 'error' | 'mcp' | 'skill' | 'plugin';
    color: string;
    shape: 'sphere' | 'octahedron' | 'cylinder' | 'torus' | 'dodecahedron';
  }> = [
    { type: 'document', color: '#3B82F6', shape: 'sphere' },
    { type: 'error', color: '#EF4444', shape: 'octahedron' },
    { type: 'mcp', color: '#06B6D4', shape: 'cylinder' },
    { type: 'skill', color: '#10B981', shape: 'torus' },
    { type: 'plugin', color: '#F59E0B', shape: 'dodecahedron' },
  ];

  return Array.from({ length: 20 }, (_, i) => {
    const nodeType = nodeTypes[i % nodeTypes.length];
    return {
      id: `node-${i}`,
      type: nodeType.type,
      title: `${nodeType.type.charAt(0).toUpperCase() + nodeType.type.slice(1)} ${i + 1}`,
      description: `This is a sample ${nodeType.type} node for demonstration purposes.`,
      filePath: `/path/to/${nodeType.type}/${i + 1}.md`,
      content: `# ${nodeType.type} ${i + 1}\n\nSample content...`,
      tags: ['sample', nodeType.type, `tag${i}`],
      links: [`/link/${i}`],
      position: [0, 0, 0], // Will be calculated by layout algorithm
      metadata: {
        size: Math.random() * 10000 + 1000,
        created: new Date(2024, 0, i + 1),
        modified: new Date(2024, 1, i + 1),
        accessed: new Date(),
        accessCount: Math.floor(Math.random() * 100),
        importance: Math.random(),
      },
      visual: {
        color: nodeType.color,
        size: 1 + Math.random() * 0.5,
        shape: nodeType.shape,
        glow: i % 3 === 0,
        icon: nodeType.type,
      },
    };
  });
}

function generateMockConnections(): Connection[] {
  return Array.from({ length: 30 }, (_, i) => ({
    id: `conn-${i}`,
    source: `node-${Math.floor(Math.random() * 20)}`,
    target: `node-${Math.floor(Math.random() * 20)}`,
    type: ['reference', 'dependency', 'related'][Math.floor(Math.random() * 3)] as any,
    strength: Math.random(),
    metadata: {
      created: new Date(),
      manual: false,
    },
    visual: {
      color: '#FFFFFF',
      width: 2,
      dashed: i % 2 === 0,
      animated: i % 3 === 0,
    },
  }));
}
