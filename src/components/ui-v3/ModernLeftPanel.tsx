'use client';

import { useState } from 'react';
import { Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';

/**
 * 赛博朋克科技风格左侧面板
 * 特点：节点类型过滤、统计信息、霓虹配色
 */
export default function ModernLeftPanel() {
  const { nodes, enabledNodeTypes, toggleNodeType, visualizationMode } = useKnowledgeStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['skills', 'plugins', 'mcps', 'hooks', 'rules', 'agents', 'memory'])
  );

  // 根据可视化模式动态生成分类
  const categories = visualizationMode === 'claude-config'
    ? [
        // Claude 配置模式 - 使用赛博朋克配色
        {
          id: 'skills',
          name: 'Skills',
          type: 'skill',
          count: nodes.filter((n) => n.type === 'skill').length,
          color: '#10B981', // 绿色 - 技能层
        },
        {
          id: 'plugins',
          name: 'Plugins',
          type: 'plugin',
          count: nodes.filter((n) => n.type === 'plugin').length,
          color: '#F59E0B', // 琥珀色 - 插件层
        },
        {
          id: 'mcps',
          name: 'MCP Servers',
          type: 'mcp',
          count: nodes.filter((n) => n.type === 'mcp').length,
          color: '#06B6D4', // 青色 - MCP层
        },
        {
          id: 'hooks',
          name: 'Hooks',
          type: 'hook',
          count: nodes.filter((n) => n.type === 'hook').length,
          color: '#EF4444', // 红色 - 钩子层
        },
        {
          id: 'rules',
          name: 'Rules',
          type: 'rule',
          count: nodes.filter((n) => n.type === 'rule').length,
          color: '#8B5CF6', // 紫色 - 规则层
        },
        {
          id: 'agents',
          name: 'Agents',
          type: 'agent',
          count: nodes.filter((n) => n.type === 'agent').length,
          color: '#EC4899', // 粉色 - Agent层
        },
        {
          id: 'memory',
          name: 'Memory',
          type: 'memory',
          count: nodes.filter((n) => n.type === 'memory').length,
          color: '#14B8A6', // 青绿色 - 记忆层
        },
        {
          id: 'categories',
          name: 'Categories',
          type: 'category',
          count: nodes.filter((n) => n.type === 'category').length,
          color: '#00FFFF', // 霓虹青 - 分类层
        },
      ]
    : [
        // 项目结构模式
        {
          id: 'pages',
          name: '页面 Pages',
          type: 'page',
          count: nodes.filter((n) => n.type === 'page').length,
          color: '#2196F3',
        },
        {
          id: 'components-ui',
          name: 'UI 组件',
          type: 'component-ui',
          count: nodes.filter((n) => n.type === 'component-ui').length,
          color: '#E91E63',
        },
        {
          id: 'components-scene',
          name: '场景组件',
          type: 'component-scene',
          count: nodes.filter((n) => n.type === 'component-scene').length,
          color: '#9C27B0',
        },
        {
          id: 'stores',
          name: '状态管理',
          type: 'store',
          count: nodes.filter((n) => n.type === 'store').length,
          color: '#F44336',
        },
        {
          id: 'services',
          name: '服务层',
          type: 'service',
          count: nodes.filter((n) => n.type === 'service').length,
          color: '#FF9800',
        },
        {
          id: 'api-routes',
          name: 'API 路由',
          type: 'api-route',
          count: nodes.filter((n) => n.type === 'api-route').length,
          color: '#4CAF50',
        },
        {
          id: 'utils',
          name: '工具函数',
          type: 'util',
          count: nodes.filter((n) => n.type === 'util').length,
          color: '#FFEB3B',
        },
        {
          id: 'types',
          name: '类型定义',
          type: 'type-def',
          count: nodes.filter((n) => n.type === 'type-def').length,
          color: '#607D8B',
        },
      ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <aside
      className="
        fixed
        left-0
        top-16
        bottom-0
        w-60
        bg-[#0F172A]
        border-r
        border-[#1E293B]
        overflow-y-auto
      "
    >
      <div className="p-4 space-y-4">
        {/* 标题 */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#00FFFF]" />
          <h2 className="text-lg font-bold text-[#00FFFF]">过滤器</h2>
        </div>

        {/* 统计卡片 */}
        <div className="bg-[#1E293B] rounded-lg p-4 space-y-2 border border-[#00FFFF]/20">
          <div className="text-xs text-gray-400 font-medium">节点统计</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#00FFFF]">
                {nodes.length}
              </div>
              <div className="text-xs text-gray-500">总节点</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FF00FF]">
                {enabledNodeTypes.size}
              </div>
              <div className="text-xs text-gray-500">已启用类型</div>
            </div>
          </div>
        </div>

        {/* 节点类型过滤器 */}
        <div className="space-y-2">
          <div className="text-xs text-gray-400 font-medium mb-3">
            节点类型
          </div>

          {categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const isEnabled = enabledNodeTypes.has(category.type);

            return (
              <div key={category.id} className="space-y-1">
                {/* 分类标题 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="
                      p-1
                      hover:bg-[#1E293B]
                      rounded
                      transition-colors
                    "
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  <label className="flex items-center gap-2 flex-1 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleNodeType(category.type)}
                      className="
                        w-4
                        h-4
                        rounded
                        border-gray-600
                        bg-[#1E293B]
                        text-[#00FFFF]
                        focus:ring-2
                        focus:ring-[#00FFFF]/30
                      "
                    />
                    <div
                      className="w-3 h-3 rounded-full shadow-lg"
                      style={{
                        backgroundColor: category.color,
                        boxShadow: `0 0 10px ${category.color}40`
                      }}
                    />
                    <span className="text-sm text-gray-200 font-medium flex-1 group-hover:text-white">
                      {category.name}
                    </span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: category.color }}
                    >
                      {category.count}
                    </span>
                  </label>
                </div>

                {/* 分类内容（可折叠） */}
                {isExpanded && (
                  <div className="ml-10 pl-2 border-l border-[#1E293B]">
                    <div className="text-xs text-gray-500 py-1">
                      显示 {category.count} 个节点
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
