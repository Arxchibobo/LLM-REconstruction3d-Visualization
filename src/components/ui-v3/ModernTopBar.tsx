'use client';

import { useState, useEffect } from 'react';
import { Search, Settings, User, Grid3x3, Box, Eye, Folder, FileCode } from 'lucide-react';
import { useKnowledgeStore, VisualizationMode } from '@/stores/useKnowledgeStore';

/**
 * 赛博朋克科技风格顶部导航栏
 * 特点：深色背景、霓虹强调色、科技感
 */
export default function ModernTopBar() {
  const {
    searchQuery,
    setSearchQuery,
    loadKnowledgeBase,
    loadProjectStructure,
    visualizationMode,
    setVisualizationMode,
    setIsTransitioning
  } = useKnowledgeStore();

  // 设置面板状态
  const [showSettings, setShowSettings] = useState(false);
  // 用户面板状态
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 移除了 viewMode 状态(2D/VR切换功能暂不实现)

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('button[title="设置"]') && showSettings) {
        setShowSettings(false);
      }
      if (!target.closest('button[title="用户"]') && showUserMenu) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings, showUserMenu]);

  // 应用启动时自动加载知识库
  useEffect(() => {
    const autoLoadKnowledgeBase = async () => {
      const defaultPath = 'E:\\Bobo\'s Coding cache\\.claude';

      try {
        await loadKnowledgeBase(defaultPath);
      } catch (error) {
      }
    };

    autoLoadKnowledgeBase();
  }, []); // 空依赖数组，仅在组件挂载时执行一次

  // 切换数据源（带过渡动画）
  const handleDataSourceSwitch = async (mode: VisualizationMode) => {
    if (mode === visualizationMode) return;

    // 1. 开始淡出
    setIsTransitioning(true);

    // 2. 等待淡出完成
    await new Promise((resolve) => setTimeout(resolve, 400));

    // 3. 加载新数据
    if (mode === 'claude-config') {
      const claudePath = 'E:\\Bobo\'s Coding cache\\.claude';
      await loadKnowledgeBase(claudePath);
      setVisualizationMode('claude-config');
    } else {
      await loadProjectStructure('');
    }

    // 4. 淡入
    setIsTransitioning(false);
  };

  return (
    <header
      className="
        fixed
        top-0
        left-0
        right-0
        h-16
        bg-[#0F172A]
        border-b
        border-[#1E293B]
        shadow-lg
        shadow-[#00FFFF]/5
        z-50
      "
    >
      <div className="h-full flex items-center justify-between px-6 gap-6">
        {/* 左侧：Logo + 标题 */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div
            className="
              w-10
              h-10
              flex
              items-center
              justify-center
              bg-gradient-to-br
              from-[#00FFFF]
              to-[#FF00FF]
              rounded-lg
              shadow-lg
              shadow-[#00FFFF]/30
            "
          >
            <Box className="w-6 h-6 text-[#0A1929]" />
          </div>

          {/* 标题 */}
          <div>
            <h1 className="text-lg font-bold text-[#00FFFF]">KnowGraph</h1>
            <p className="text-xs text-gray-400">工程化调用可视化</p>
          </div>
        </div>

        {/* 中间：搜索框 */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索节点、Skills、MCP、Plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full
                h-10
                pl-10
                pr-4
                bg-[#1E293B]
                border
                border-transparent
                rounded-lg
                text-sm
                text-gray-200
                placeholder-gray-500
                focus:outline-none
                focus:border-[#00FFFF]
                focus:ring-2
                focus:ring-[#00FFFF]/20
                focus:shadow-lg
                focus:shadow-[#00FFFF]/10
                transition-all
                duration-200
              "
            />
          </div>
        </div>

        {/* 右侧：数据源切换 + 功能按钮 */}
        <div className="flex items-center gap-3">
          {/* 数据源切换 */}
          <div className="flex items-center bg-[#1E293B] rounded-lg p-1">
            <button
              onClick={() => handleDataSourceSwitch('claude-config')}
              className={`
                px-3
                py-1.5
                text-xs
                font-medium
                rounded-md
                transition-all
                duration-200
                flex
                items-center
                gap-1.5
                ${
                  visualizationMode === 'claude-config'
                    ? 'bg-[#00FFFF]/20 text-[#00FFFF] shadow-sm'
                    : 'text-gray-400 hover:text-[#00FFFF]'
                }
              `}
            >
              <Folder className="w-3.5 h-3.5" />
              Claude 配置
            </button>
            <button
              onClick={() => handleDataSourceSwitch('project-structure')}
              className={`
                px-3
                py-1.5
                text-xs
                font-medium
                rounded-md
                transition-all
                duration-200
                flex
                items-center
                gap-1.5
                ${
                  visualizationMode === 'project-structure'
                    ? 'bg-[#FF00FF]/20 text-[#FF00FF] shadow-sm'
                    : 'text-gray-400 hover:text-[#FF00FF]'
                }
              `}
            >
              <FileCode className="w-3.5 h-3.5" />
              项目结构
            </button>
          </div>

          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="
              w-10
              h-10
              flex
              items-center
              justify-center
              text-gray-400
              hover:text-[#00FFFF]
              hover:bg-[#1E293B]
              rounded-lg
              transition-all
              duration-200
              relative
            "
            title="设置"
          >
            <Settings className="w-5 h-5" />
            {/* 设置弹窗 */}
            {showSettings && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl p-4 z-50">
                <h3 className="text-sm font-bold text-[#00FFFF] mb-3">设置</h3>
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-center justify-between py-2 border-b border-[#334155]">
                    <span>显示粒子效果</span>
                    <input type="checkbox" defaultChecked className="accent-[#00FFFF]" />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#334155]">
                    <span>显示网格地板</span>
                    <input type="checkbox" defaultChecked className="accent-[#00FFFF]" />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#334155]">
                    <span>动画效果</span>
                    <input type="checkbox" defaultChecked className="accent-[#00FFFF]" />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>性能模式</span>
                    <select className="bg-[#0F172A] text-[#00FFFF] px-2 py-1 rounded border border-[#334155]">
                      <option>高质量</option>
                      <option selected>平衡</option>
                      <option>性能优先</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </button>

          {/* 用户头像 */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="
              w-10
              h-10
              flex
              items-center
              justify-center
              bg-[#00FFFF]
              text-[#0A1929]
              rounded-full
              relative
              hover:bg-[#FF00FF]
              transition-all
              duration-200
            "
            title="用户"
          >
            <User className="w-5 h-5" />
            {/* 用户菜单弹窗 */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl overflow-hidden z-50">
                {/* 用户信息 */}
                <div className="bg-gradient-to-r from-[#00FFFF]/10 to-[#FF00FF]/10 p-4 border-b border-[#334155]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#00FFFF] rounded-full flex items-center justify-center text-[#0A1929] font-bold">
                      B
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Bobo</p>
                      <p className="text-xs text-gray-400">开发者</p>
                    </div>
                  </div>
                </div>
                {/* 菜单选项 */}
                <div className="p-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#334155] hover:text-[#00FFFF] rounded transition-colors">
                    个人资料
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#334155] hover:text-[#00FFFF] rounded transition-colors">
                    项目设置
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#334155] hover:text-[#00FFFF] rounded transition-colors">
                    主题设置
                  </button>
                  <div className="border-t border-[#334155] my-2"></div>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#334155] hover:text-[#FF00FF] rounded transition-colors">
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
