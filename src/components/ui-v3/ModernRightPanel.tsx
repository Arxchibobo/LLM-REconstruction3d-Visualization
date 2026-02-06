'use client';

import { X, Zap, GitBranch, Box, FileCode, Terminal, Info } from 'lucide-react';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import { useMemo } from 'react';

/**
 * 赛博朋克风格右侧详情面板
 * 特点：深色背景、霓虹强调色、Claude运作机制可视化
 */
export default function ModernRightPanel() {
  const { selectedNode, setSelectedNode, connections, nodes } = useKnowledgeStore();

  // 计算与当前节点相关的连接（分类：入站和出站）
  const { incomingConnections, outgoingConnections } = useMemo(() => {
    if (!selectedNode) return { incomingConnections: [], outgoingConnections: [] };

    const incoming = connections.filter((conn) => conn.target === selectedNode.id);
    const outgoing = connections.filter((conn) => conn.source === selectedNode.id);

    return { incomingConnections: incoming, outgoingConnections: outgoing };
  }, [selectedNode, connections]);

  // 获取连接的节点信息（带方向）
  const getConnectedNodeInfo = (conn: any, direction: 'in' | 'out') => {
    if (!conn) return null;

    const nodeId = direction === 'in' ? conn.source : conn.target;
    if (!nodeId) return null;

    const node = nodes.find((n) => n.id === nodeId);
    return {
      id: nodeId,
      title: node?.title || nodeId,
      type: node?.type || 'unknown',
      connectionType: conn?.type || 'unknown',
      connectionLabel: conn?.label || conn?.type || '未知连接',
    };
  };

  // Claude运作机制说明
  const getClaudeOperationExplanation = (nodeType: string) => {
    const explanations: Record<string, { icon: any; title: string; description: string; color: string }> = {
      claude: {
        icon: Box,
        title: 'Claude 核心引擎',
        description: 'Claude Code 是 AI 编程助手的核心,负责理解用户需求、调用适配器获取配置数据,并协调所有工具的使用。',
        color: '#00FFFF',
      },
      adapter: {
        icon: GitBranch,
        title: '数据适配器层',
        description: '适配器负责读取和解析配置文件(如 .claude 目录),将原始数据转换为 Claude 可以理解的结构化格式。它是 Claude 和配置数据之间的桥梁。',
        color: '#00FFFF',
      },
      category: {
        icon: FileCode,
        title: '工具分类',
        description: '按功能分类的工具容器(Skills/MCP/Plugins)。Claude 通过分类快速定位所需工具,提高调用效率。',
        color: '#FF00FF',
      },
      skill: {
        icon: Terminal,
        title: 'Skill 技能工具',
        description: 'Skills 是 Claude 的可执行技能,每个 Skill 封装了特定的功能逻辑。Claude 根据用户需求动态调用相应的 Skill。',
        color: '#FFA500',
      },
      mcp: {
        icon: Zap,
        title: 'MCP 服务器',
        description: 'Model Context Protocol 服务器提供外部数据源和功能扩展。Claude 通过 MCP 连接数据库、API 等外部服务。',
        color: '#FFA500',
      },
      plugin: {
        icon: Box,
        title: 'Plugin 插件',
        description: 'Plugins 扩展 Claude 的核心功能,提供额外的工具和能力。',
        color: '#F59E0B',
      },
      hook: {
        icon: Zap,
        title: 'Hook 钩子',
        description: 'Hooks 拦截 Claude 的工具调用，可以在调用前后执行自定义逻辑，如验证、日志记录、参数修改等。支持 PreToolUse、PostToolUse、Stop 等多种时机。',
        color: '#EF4444',
      },
      rule: {
        icon: FileCode,
        title: 'Rule 规则',
        description: 'Rules 定义了 Claude 在特定场景下的行为准则，包括代码风格、安全规范、工作流程等。Claude 会在执行任务时参考这些规则。',
        color: '#8B5CF6',
      },
      agent: {
        icon: Box,
        title: 'Agent 代理',
        description: 'Agents 是专门化的 AI 智能体，可以接受任务委派，独立执行复杂的多步骤任务。每个 Agent 有特定的专长领域。',
        color: '#EC4899',
      },
      memory: {
        icon: GitBranch,
        title: 'Memory 记忆',
        description: 'Memory 存储了 Claude 的学习记录、对话历史和缓存数据。帮助 Claude 记住用户偏好和历史交互。',
        color: '#14B8A6',
      },
    };

    return explanations[nodeType] || {
      icon: Info,
      title: '通用节点',
      description: '这是一个通用节点类型。',
      color: '#888888',
    };
  };

  if (!selectedNode) return null;

  const operationInfo = getClaudeOperationExplanation(selectedNode.type);
  const IconComponent = operationInfo.icon;

  return (
    <aside
      className="
        fixed
        right-0
        top-16
        bottom-0
        w-96
        bg-[#0F172A]
        border-l
        border-[#1E293B]
        overflow-y-auto
        shadow-2xl
        shadow-[#00FFFF]/10
      "
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#00FFFF40 #1E293B',
        zIndex: 50, // 🔧 确保在 Canvas 之上
      }}
    >
      <div className="p-6 space-y-6">
        {/* 标题和关闭按钮 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#00FFFF] mb-2">
              {selectedNode.title}
            </h2>
            <div className="flex items-center gap-2">
              <span
                className="
                  inline-block
                  px-3
                  py-1
                  text-xs
                  font-medium
                  rounded-full
                  border
                "
                style={{
                  backgroundColor: `${operationInfo.color}20`,
                  borderColor: `${operationInfo.color}60`,
                  color: operationInfo.color,
                }}
              >
                {selectedNode.type.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="
              p-2
              hover:bg-[#1E293B]
              rounded-lg
              transition-colors
              text-gray-400
              hover:text-[#FF00FF]
            "
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Claude运作机制说明 */}
        <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-lg p-4 border border-[#334155]">
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `${operationInfo.color}20`,
                border: `1px solid ${operationInfo.color}40`,
              }}
            >
              <IconComponent className="w-5 h-5" style={{ color: operationInfo.color }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-1">{operationInfo.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {operationInfo.description}
              </p>
            </div>
          </div>

          {/* 运作流程指示 */}
          <div className="mt-4 pt-4 border-t border-[#334155]">
            <div className="text-xs text-gray-500 mb-2">在调用链中的角色:</div>
            <div className="space-y-1">
              {selectedNode.type === 'claude' && (
                <div className="text-xs text-[#00FFFF]">
                  → 接收用户请求 → 调用 Adapter → 获取工具列表 → 执行任务
                </div>
              )}
              {selectedNode.type === 'adapter' && (
                <div className="text-xs text-[#00FFFF]">
                  ← Claude 调用 → 读取配置 → 解析数据 → 返回给 Claude
                </div>
              )}
              {selectedNode.type === 'category' && (
                <div className="text-xs text-[#FF00FF]">
                  ← Adapter 提供 → 分类管理 → 提供工具列表 → Skills/MCP/Plugins
                </div>
              )}
              {(selectedNode.type === 'skill' || selectedNode.type === 'mcp' || selectedNode.type === 'plugin') && (
                <div className="text-xs text-[#FFA500]">
                  ← Category 管理 → Claude 调用 → 执行功能 → 返回结果
                </div>
              )}
              {selectedNode.type === 'hook' && (
                <div className="text-xs text-[#EF4444]">
                  ← 工具调用请求 → Hook 拦截 → 执行自定义逻辑 → 继续/阻止调用
                </div>
              )}
              {selectedNode.type === 'rule' && (
                <div className="text-xs text-[#8B5CF6]">
                  ← Claude 读取 → 应用规则 → 指导执行行为 → 确保一致性
                </div>
              )}
              {selectedNode.type === 'agent' && (
                <div className="text-xs text-[#EC4899]">
                  ← Claude 委派任务 → Agent 接收 → 独立执行 → 返回结果
                </div>
              )}
              {selectedNode.type === 'memory' && (
                <div className="text-xs text-[#14B8A6]">
                  ← Claude 写入/读取 → 存储学习记录 → 提供历史上下文
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 描述 */}
        {selectedNode.description && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-[#00FFFF]">
              <FileCode className="w-4 h-4" />
              <span>详细说明</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed bg-[#1E293B] p-3 rounded-lg">
              {selectedNode.description}
            </p>
          </div>
        )}

        {/* 调用关系：入站连接 */}
        {incomingConnections.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[#00FFFF]">
              <GitBranch className="w-4 h-4" />
              <span>被谁调用 ({incomingConnections.length})</span>
            </div>
            <div className="space-y-2">
              {incomingConnections.map((conn, idx) => {
                const info = getConnectedNodeInfo(conn, 'in');
                if (!info) return null; // 跳过无效的连接

                return (
                  <div
                    key={idx}
                    className="
                      bg-[#1E293B]
                      p-3
                      rounded-lg
                      border
                      border-[#334155]
                      hover:border-[#00FFFF]
                      transition-colors
                      cursor-pointer
                    "
                    onClick={() => {
                      const node = nodes.find((n) => n.id === info.id);
                      if (node) setSelectedNode(node);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{info.title}</span>
                      <span className="text-xs text-[#00FFFF] font-mono">{info.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">连接类型:</span>
                      <span className="text-xs text-[#FF00FF]">{info.connectionLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 调用关系:出站连接 */}
        {outgoingConnections.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[#00FFFF]">
              <GitBranch className="w-4 h-4 transform rotate-180" />
              <span>调用了谁 ({outgoingConnections.length})</span>
            </div>
            <div className="space-y-2">
              {outgoingConnections.map((conn, idx) => {
                const info = getConnectedNodeInfo(conn, 'out');
                if (!info) return null; // 跳过无效的连接

                return (
                  <div
                    key={idx}
                    className="
                      bg-[#1E293B]
                      p-3
                      rounded-lg
                      border
                      border-[#334155]
                      hover:border-[#FF00FF]
                      transition-colors
                      cursor-pointer
                    "
                    onClick={() => {
                      const node = nodes.find((n) => n.id === info.id);
                      if (node) setSelectedNode(node);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{info.title}</span>
                      <span className="text-xs text-[#FF00FF] font-mono">{info.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">连接类型:</span>
                      <span className="text-xs text-[#FFA500]">{info.connectionLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 元数据 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#00FFFF]">
            <Info className="w-4 h-4" />
            <span>节点信息</span>
          </div>

          <div className="bg-[#1E293B] rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">节点 ID</span>
              <span className="text-[#00FFFF] font-mono text-xs">{selectedNode.id}</span>
            </div>

            {selectedNode.filePath && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-400">文件路径</span>
                <span className="text-xs text-[#FF00FF] font-mono break-all bg-[#0F172A] p-2 rounded">
                  {selectedNode.filePath}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-400">入站连接</span>
              <span className="text-[#00FFFF] font-bold">{incomingConnections.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">出站连接</span>
              <span className="text-[#FF00FF] font-bold">{outgoingConnections.length}</span>
            </div>

            {selectedNode.tags && selectedNode.tags.length > 0 && (
              <div className="pt-3 border-t border-[#334155]">
                <span className="text-gray-400 text-xs mb-2 block">标签</span>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.tags.map((tag) => (
                    <span
                      key={tag}
                      className="
                        px-2
                        py-1
                        text-xs
                        font-medium
                        bg-[#0F172A]
                        text-[#00FFFF]
                        rounded-full
                        border
                        border-[#00FFFF]40
                      "
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 内容预览 (如果有) */}
        {selectedNode.content && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[#00FFFF]">
              <Terminal className="w-4 h-4" />
              <span>内容预览</span>
            </div>
            <div
              className="
                text-xs
                text-gray-300
                font-mono
                bg-[#1E293B]
                p-4
                rounded-lg
                max-h-60
                overflow-y-auto
                leading-relaxed
                border
                border-[#334155]
              "
            >
              {selectedNode.content.slice(0, 500)}
              {selectedNode.content.length > 500 && '...'}
            </div>
          </div>
        )}

        {/* 底部提示 */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
          <div className="text-xs text-gray-400">
            💡 <span className="text-[#00FFFF]">提示</span>: 点击上方连接的节点可以查看详情
          </div>
        </div>
      </div>
    </aside>
  );
}
