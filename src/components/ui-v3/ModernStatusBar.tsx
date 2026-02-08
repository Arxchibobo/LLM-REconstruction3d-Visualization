'use client';

import { ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import { useActivityStore } from '@/stores/useActivityStore';

/**
 * 赛博朋克科技风格底部状态栏
 * 特点：缩放控制、重置视图、状态信息、霓虹色调
 */
export default function ModernStatusBar() {
  const {
    selectedNode,
    nodes,
    cameraZoom,
    setCameraZoom,
    triggerCameraReset,
  } = useKnowledgeStore();
  const { isLive, isConnected } = useActivityStore();

  const handleZoomIn = () => {
    setCameraZoom(Math.min(200, cameraZoom + 10));
  };

  const handleZoomOut = () => {
    setCameraZoom(Math.max(10, cameraZoom - 10));
  };

  const handleResetView = () => {
    setCameraZoom(100);
    triggerCameraReset();
  };

  return (
    <footer
      className="
        fixed
        left-0
        right-0
        bottom-0
        h-10
        bg-[#0F172A]
        border-t
        border-[#1E293B]
        shadow-lg
        shadow-[#00FFFF]/5
      "
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* 左侧：控制按钮 */}
        <div className="flex items-center gap-4">
          {/* 缩放控制 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="
                p-1
                hover:bg-[#1E293B]
                rounded
                transition-colors
              "
              title="缩小"
            >
              <ZoomOut className="w-4 h-4 text-gray-400 hover:text-[#00FFFF]" />
            </button>

            <span className="text-sm text-[#00FFFF] font-medium font-mono min-w-[50px] text-center">
              {cameraZoom}%
            </span>

            <button
              onClick={handleZoomIn}
              className="
                p-1
                hover:bg-[#1E293B]
                rounded
                transition-colors
              "
              title="放大"
            >
              <ZoomIn className="w-4 h-4 text-gray-400 hover:text-[#00FFFF]" />
            </button>
          </div>

          {/* 分隔线 */}
          <div className="w-px h-4 bg-[#1E293B]" />

          {/* 重置视图 */}
          <button
            onClick={handleResetView}
            className="
              flex
              items-center
              gap-1.5
              px-3
              py-1
              text-sm
              text-[#FF00FF]
              hover:bg-[#1E293B]
              rounded
              transition-colors
            "
            title="重置视图"
          >
            <Maximize2 className="w-4 h-4" />
            <span>重置</span>
          </button>
        </div>

        {/* 中间：状态信息 */}
        <div className="flex items-center gap-6 text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#00FFFF]" />
            <span>节点总数: <span className="text-[#00FFFF]">{nodes.length}</span></span>
          </div>

          {selectedNode && (
            <>
              <div className="w-px h-3 bg-[#1E293B]" />
              <span>已选中: <span className="text-[#FF00FF]">{selectedNode.title}</span></span>
            </>
          )}
        </div>

        {/* 右侧：LIVE 状态 + 版本信息 */}
        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-600'
                }`}
              />
              <span
                className={`text-xs font-mono font-medium ${
                  isLive ? 'text-red-400' : 'text-gray-500'
                }`}
              >
                {isLive ? 'LIVE' : 'IDLE'}
              </span>
            </div>
          )}
          <div className="text-xs text-gray-500 font-mono">
            KnowGraph v3.0 Cyberpunk
          </div>
        </div>
      </div>
    </footer>
  );
}
