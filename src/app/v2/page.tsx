'use client';

import dynamic from 'next/dynamic';
import CyberpunkTopBar from '@/components/ui-v2/CyberpunkTopBar';
import LeftSidebar from '@/components/ui-v2/LeftSidebar';

// 动态导入 3D 场景组件（避免 SSR 问题）
const Scene3D = dynamic(() => import('@/components/scene/Scene'), { ssr: false });

/**
 * V2 主页面 - 全新赛博朋克风格设计
 * 特点：玻璃态UI、霓虹效果、完整布局
 */
export default function V2HomePage() {
  return (
    <div
      className="
        relative
        w-screen
        h-screen
        overflow-hidden
        bg-gradient-to-br
        from-[#0A0E27]
        to-[#050810]
      "
    >
      {/* 背景粒子效果 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(0,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255,0,255,0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* 背景网格 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,255,255,0.1) 40px, rgba(0,255,255,0.1) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,255,255,0.1) 40px, rgba(0,255,255,0.1) 41px)
          `,
        }}
      />

      {/* 顶部导航栏 */}
      <CyberpunkTopBar />

      {/* 左侧边栏 */}
      <LeftSidebar />

      {/* 主要内容区域 - 3D Canvas */}
      <main
        className="
          absolute
          left-60
          top-16
          right-0
          bottom-12
          overflow-hidden
        "
      >
        {/* 3D 场景 */}
        <div className="relative w-full h-full">
          <Scene3D />

          {/* 加载提示 */}
          <div
            className="
              absolute
              top-4
              left-1/2
              -translate-x-1/2
              px-4
              py-2
              bg-[rgba(10,14,39,0.8)]
              backdrop-blur-md
              border
              border-cyan-500/30
              rounded-full
              text-cyan-400
              text-sm
              shadow-[0_0_20px_rgba(0,255,255,0.3)]
              animate-pulse
            "
          >
            <span className="flex items-center gap-2">
              <span
                className="
                  w-2
                  h-2
                  bg-cyan-500
                  rounded-full
                  animate-ping
                "
              />
              3D 知识图谱加载中...
            </span>
          </div>

          {/* 右下角 FPS 计数器 */}
          <div
            className="
              absolute
              bottom-4
              right-4
              px-3
              py-1.5
              bg-[rgba(10,14,39,0.8)]
              backdrop-blur-md
              border
              border-green-500/30
              rounded
              text-green-400
              text-xs
              font-mono
              shadow-[0_0_15px_rgba(0,255,0,0.3)]
            "
          >
            FPS: 60
          </div>

          {/* 左上角节点统计 */}
          <div
            className="
              absolute
              top-4
              left-4
              px-3
              py-2
              bg-[rgba(10,14,39,0.8)]
              backdrop-blur-md
              border
              border-magenta-500/30
              rounded
              space-y-1
              shadow-[0_0_15px_rgba(255,0,255,0.3)]
            "
          >
            <div className="text-xs text-magenta-400 font-semibold">
              节点统计
            </div>
            <div className="text-xs text-white/70 font-mono">
              总数: <span className="text-cyan-400">54</span>
            </div>
            <div className="text-xs text-white/70 font-mono">
              可见: <span className="text-yellow-400">32</span>
            </div>
          </div>
        </div>
      </main>

      {/* 底部工具栏 */}
      <footer
        className="
          fixed
          left-60
          right-0
          bottom-0
          h-12
          bg-[rgba(10,14,39,0.7)]
          backdrop-blur-md
          border-t
          border-cyan-500/20
          flex
          items-center
          justify-between
          px-4
          z-40
        "
      >
        {/* 左侧：缩放控制 */}
        <div className="flex items-center gap-4">
          <button
            className="
              px-3
              py-1
              text-xs
              text-cyan-400
              border
              border-cyan-500/50
              rounded
              hover:bg-cyan-500/20
              hover:shadow-[0_0_10px_rgba(0,255,255,0.5)]
              transition-all
            "
          >
            重置视图
          </button>

          <div className="flex items-center gap-2">
            <button
              className="
                w-6
                h-6
                flex
                items-center
                justify-center
                text-cyan-400
                border
                border-cyan-500/50
                rounded
                hover:bg-cyan-500/20
                transition-all
              "
            >
              -
            </button>
            <span className="text-xs text-white/70 font-mono w-12 text-center">
              100%
            </span>
            <button
              className="
                w-6
                h-6
                flex
                items-center
                justify-center
                text-cyan-400
                border
                border-cyan-500/50
                rounded
                hover:bg-cyan-500/20
                transition-all
              "
            >
              +
            </button>
          </div>
        </div>

        {/* 中间：状态信息 */}
        <div className="flex items-center gap-6 text-xs text-white/50">
          <span>相机位置: (0, 5, 15)</span>
          <span className="w-px h-4 bg-white/20" />
          <span>选中节点: 无</span>
        </div>

        {/* 右侧：小地图（占位） */}
        <div
          className="
            w-32
            h-8
            bg-[rgba(0,255,255,0.05)]
            border
            border-cyan-500/30
            rounded
            flex
            items-center
            justify-center
            text-xs
            text-cyan-400/50
          "
        >
          小地图
        </div>
      </footer>

      {/* 扫描线全局效果 */}
      <div
        className="
          fixed
          inset-0
          pointer-events-none
          z-50
        "
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.01) 2px, rgba(0,255,255,0.01) 4px)',
          animation: 'scanlines 8s linear infinite',
        }}
      />

      <style jsx>{`
        @keyframes scanlines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(4px);
          }
        }
      `}</style>
    </div>
  );
}
