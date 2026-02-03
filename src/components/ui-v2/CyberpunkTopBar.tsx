'use client';

import { useState } from 'react';
import { Search, Settings, User, Grid3x3, Layers, Filter } from 'lucide-react';
import NeonButton from './NeonButton';

/**
 * 赛博朋克风格顶部导航栏
 * 特点：玻璃态背景、搜索栏、过滤器、视图切换
 */
export default function CyberpunkTopBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'2D' | '3D' | 'VR'>('3D');

  return (
    <header
      className="
        fixed
        top-0
        left-0
        right-0
        h-16
        bg-[rgba(10,14,39,0.95)]
        backdrop-blur-md
        border-b
        border-cyan-500/30
        shadow-[0_2px_20px_rgba(0,255,255,0.2)]
        z-50
      "
    >
      <div className="h-full flex items-center justify-between px-6 gap-4">
        {/* 左侧：Logo */}
        <div className="flex items-center gap-3">
          {/* Logo 图标 - 六边形 */}
          <div
            className="
              w-10
              h-10
              flex
              items-center
              justify-center
              border-2
              border-cyan-500
              bg-cyan-500/10
              rounded
              shadow-[0_0_15px_rgba(0,255,255,0.5)]
              animate-pulse
            "
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
          >
            <Grid3x3 className="w-5 h-5 text-cyan-400" />
          </div>

          {/* Logo 文字 */}
          <div className="flex flex-col">
            <span className="text-xl font-bold text-cyan-400 tracking-wider">
              KnowGraph
            </span>
            <span className="text-xs text-cyan-500/60">
              知识图谱可视化系统
            </span>
          </div>
        </div>

        {/* 中间：搜索栏 */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索知识节点..."
              className="
                w-full
                px-4
                py-2
                pl-10
                bg-[rgba(255,255,255,0.05)]
                border-2
                border-cyan-500/50
                rounded
                text-white
                placeholder-white/40
                focus:border-magenta-500
                focus:shadow-[0_0_20px_rgba(255,0,255,0.5)]
                focus:outline-none
                transition-all
                duration-300
              "
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />

            {/* 搜索图标发光效果 */}
            <div
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                w-4
                h-4
                bg-cyan-400
                rounded-full
                blur-md
                opacity-50
                group-focus-within:opacity-100
                transition-opacity
                pointer-events-none
              "
            />
          </div>
        </div>

        {/* 右侧：工具按钮 */}
        <div className="flex items-center gap-3">
          {/* 过滤器按钮 */}
          <NeonButton variant="secondary" size="sm">
            <Filter className="w-4 h-4" />
            过滤
          </NeonButton>

          {/* 视图模式切换 */}
          <div className="flex gap-1 p-1 bg-[rgba(255,255,255,0.05)] rounded">
            {(['2D', '3D', 'VR'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  rounded
                  transition-all
                  duration-300
                  ${
                    viewMode === mode
                      ? 'bg-yellow-500 text-gray-900 shadow-[0_0_15px_rgba(255,255,0,0.5)]'
                      : 'text-cyan-400 hover:bg-cyan-500/20'
                  }
                `}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* 图层按钮 */}
          <button
            className="
              p-2
              text-cyan-400
              hover:text-magenta-400
              hover:shadow-[0_0_15px_rgba(255,0,255,0.5)]
              transition-all
              duration-300
            "
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* 设置按钮 */}
          <button
            className="
              p-2
              text-cyan-400
              hover:text-magenta-400
              hover:shadow-[0_0_15px_rgba(255,0,255,0.5)]
              transition-all
              duration-300
            "
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* 用户头像 */}
          <button
            className="
              w-10
              h-10
              flex
              items-center
              justify-center
              bg-gradient-to-br
              from-cyan-500
              to-magenta-500
              rounded-full
              border-2
              border-cyan-400
              shadow-[0_0_15px_rgba(0,255,255,0.5)]
              hover:shadow-[0_0_25px_rgba(255,0,255,0.7)]
              transition-all
              duration-300
              animate-pulse
            "
          >
            <User className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* 底部扫描线效果 */}
      <div
        className="
          absolute
          bottom-0
          left-0
          right-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-cyan-500
          to-transparent
          animate-pulse
        "
      />
    </header>
  );
}
