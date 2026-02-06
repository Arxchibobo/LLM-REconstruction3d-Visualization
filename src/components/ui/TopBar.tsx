'use client';

import { Search, Settings, FolderOpen, Grid3x3, FileText, Circle, Grid, Network, GitBranch } from 'lucide-react';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import { useState, useEffect, useRef } from 'react';

export default function TopBar() {
  const { searchQuery, setSearchQuery, setCameraTarget, layoutType, setLayoutType, loadKnowledgeBase, loading, setLoading, setError } = useKnowledgeStore();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 加载超时保护：15秒后强制重置loading状态
  useEffect(() => {
    if (loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        setError('加载超时，已使用默认数据');
      }, 15000);
    } else {
      // loading完成后清除超时
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, setLoading, setError]);

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

  const handleLoadKnowledgeBase = async () => {
    if (window.electron) {
      const path = await window.electron.dialog.selectDirectory();
      if (path) {
        await loadKnowledgeBase(path);
      }
    } else {
      // Fallback: use default path
      const defaultPath = 'C:\\Users\\Administrator\\.claude';
      await loadKnowledgeBase(defaultPath);
    }
  };

  const layoutButtons = [
    { type: 'force' as const, icon: Network, label: 'Radial' },
    { type: 'circular' as const, icon: Circle, label: 'Sphere' },
    { type: 'grid' as const, icon: Grid, label: 'Spiral' },
    { type: 'hierarchical' as const, icon: GitBranch, label: 'Tree' },
  ];

  return (
    <div className="h-16 bg-black/95 backdrop-blur-md border-b border-cyan-500/30 flex items-center px-6 gap-4 relative overflow-hidden" style={{ zIndex: 1000 }}>
      {/* Cyberpunk 扫描线 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse" />

      {/* Logo - Cyberpunk 风格 */}
      <div className="flex items-center gap-3 mr-4 relative">
        <div className="w-10 h-10 rounded border-2 border-cyan-400 bg-black flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-cyan-400/20 group-hover:bg-cyan-400/30 transition-all" />
          <Grid3x3 className="w-5 h-5 text-cyan-400 relative z-10" />
          {/* 角落装饰 */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-cyan-400 tracking-wider font-mono">
            RECONSTRUCTION_3D
          </h1>
          <div className="text-xs text-cyan-400/60 font-mono">v2.0.CYBER</div>
        </div>
      </div>

      {/* Search Bar - HUD 风格 */}
      <div
        className={`flex-1 max-w-2xl relative ${
          isSearchFocused ? 'scale-[1.02]' : ''
        } transition-all`}
      >
        <div className="relative border border-cyan-500/40 bg-black/60">
          {/* 左上角装饰 */}
          <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder=">> SEARCH DATABASE_"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent text-cyan-400 placeholder-cyan-400/40 font-mono text-sm focus:outline-none"
          />
          {searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-magenta-400 font-mono animate-pulse">
              [ENTER]
            </div>
          )}
        </div>
      </div>

      {/* Layout Buttons - HUD 风格 */}
      <div className="flex items-center gap-1 bg-black/60 p-1 border border-cyan-500/40 relative">
        <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-cyan-400" />
        <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-cyan-400" />

        {layoutButtons.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => setLayoutType(type)}
            className={`p-2.5 transition-all relative group ${
              layoutType === type
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'hover:bg-cyan-500/10 text-cyan-400/60'
            }`}
            title={`${label} Layout`}
          >
            <Icon className="w-4 h-4 relative z-10" />
            {layoutType === type && (
              <div className="absolute inset-0 border border-cyan-400" />
            )}
          </button>
        ))}
      </div>

      {/* Action Button - Cyberpunk 风格 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleLoadKnowledgeBase}
          className="p-2.5 border border-magenta-500/60 bg-black/60 hover:bg-magenta-500/10 transition-all text-magenta-400 relative group"
          title="Open Knowledge Base"
        >
          <FolderOpen className="w-5 h-5 relative z-10" />
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-magenta-400" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-magenta-400" />
        </button>
      </div>
    </div>
  );
}
