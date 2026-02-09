'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import ModernTopBar from '@/components/ui-v3/ModernTopBar';
import ModernLeftPanel from '@/components/ui-v3/ModernLeftPanel';
import ModernRightPanel from '@/components/ui-v3/ModernRightPanel';
import ModernStatusBar from '@/components/ui-v3/ModernStatusBar';
import Minimap from '@/components/ui-v3/Minimap';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';

// 动态导入 3D 场景组件（避免 SSR 问题）
const Scene3D = dynamic(() => import('@/components/scene/Scene'), { ssr: false });

/**
 * V3 主页面 - 赛博朋克科技风格设计
 * 设计理念：3D可视化工程化调用关系
 * 配色：深蓝黑背景 + 青色/品红/橙色霓虹
 */
export default function V3HomePage() {
  const { loadClaudeConfig } = useKnowledgeStore();

  // Load Claude config on mount - path is auto-detected from environment
  useEffect(() => {
    const claudeConfigPath = process.env.NEXT_PUBLIC_CLAUDE_CONFIG_PATH || '';
    loadClaudeConfig(claudeConfigPath).catch((error) => {
      console.error('Failed to load Claude config:', error);
    });
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A1929]">
      {/* 顶部导航栏 */}
      <ModernTopBar />

      {/* 左侧过滤面板 */}
      <ModernLeftPanel />

      {/* 右侧详情面板（条件渲染） */}
      <ModernRightPanel />

      {/* 主要内容区域 - 3D Canvas */}
      <main
        className="
          absolute
          left-60
          top-16
          right-0
          bottom-10
          overflow-hidden
        "
      >
        {/* 3D 场景容器 - 移除白色背景,让3D场景本身的深色背景显示 */}
        <div className="relative w-full h-full overflow-hidden m-4">
          <Scene3D />
        </div>
      </main>

      {/* 底部状态栏 */}
      <ModernStatusBar />

      {/* 小地图 */}
      <Minimap />
    </div>
  );
}
