'use client';

import { X, RotateCcw, Monitor, Sparkles, Grid3x3, Zap, Palette } from 'lucide-react';
import { useSettingsStore, type ThemeMode, type PerformanceMode } from '@/stores/useSettingsStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`
        relative w-10 h-5 rounded-full transition-colors duration-200
        ${checked ? 'bg-[#00FFFF]/30' : 'bg-[#334155]'}
      `}
    >
      <div
        className={`
          absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200
          ${checked ? 'left-[22px] bg-[#00FFFF]' : 'left-0.5 bg-gray-500'}
        `}
      />
    </button>
  );
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    showParticles,
    showGridFloor,
    enableAnimations,
    performanceMode,
    theme,
    setShowParticles,
    setShowGridFloor,
    setEnableAnimations,
    setPerformanceMode,
    setTheme,
    resetToDefaults,
  } = useSettingsStore();

  if (!isOpen) return null;

  const themes: Array<{ value: ThemeMode; label: string; color: string }> = [
    { value: 'cyberpunk', label: '赛博朋克', color: '#00FFFF' },
    { value: 'dark', label: '暗黑', color: '#6366F1' },
    { value: 'light', label: '明亮', color: '#F59E0B' },
  ];

  const perfModes: Array<{ value: PerformanceMode; label: string; desc: string }> = [
    { value: 'high', label: '高质量', desc: '最佳视觉效果' },
    { value: 'balanced', label: '平衡', desc: '推荐设置' },
    { value: 'performance', label: '性能优先', desc: '流畅优先' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl shadow-[#00FFFF]/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#00FFFF]/10 to-[#FF00FF]/10 border-b border-[#1E293B]">
          <h2 className="text-lg font-semibold text-white">系统设置</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Display Section */}
          <div>
            <h3 className="text-sm font-semibold text-[#00FFFF] mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              显示设置
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#1E293B] rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00FFFF]" />
                  <div>
                    <p className="text-sm text-gray-200">粒子效果</p>
                    <p className="text-xs text-gray-500">3D 场景背景粒子</p>
                  </div>
                </div>
                <Toggle checked={showParticles} onChange={setShowParticles} />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1E293B] rounded-lg">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4 text-[#00FFFF]" />
                  <div>
                    <p className="text-sm text-gray-200">网格地板</p>
                    <p className="text-xs text-gray-500">3D 场景地面网格</p>
                  </div>
                </div>
                <Toggle checked={showGridFloor} onChange={setShowGridFloor} />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1E293B] rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#00FFFF]" />
                  <div>
                    <p className="text-sm text-gray-200">动画效果</p>
                    <p className="text-xs text-gray-500">节点旋转和脉冲动画</p>
                  </div>
                </div>
                <Toggle checked={enableAnimations} onChange={setEnableAnimations} />
              </div>
            </div>
          </div>

          {/* Performance Section */}
          <div>
            <h3 className="text-sm font-semibold text-[#FF00FF] mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              性能模式
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {perfModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setPerformanceMode(mode.value)}
                  className={`
                    p-3 rounded-lg border text-center transition-all
                    ${
                      performanceMode === mode.value
                        ? 'bg-[#FF00FF]/10 border-[#FF00FF]/50 text-[#FF00FF]'
                        : 'bg-[#1E293B] border-[#334155] text-gray-400 hover:border-[#FF00FF]/30'
                    }
                  `}
                >
                  <p className="text-sm font-medium">{mode.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-60">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Section */}
          <div>
            <h3 className="text-sm font-semibold text-[#FFFF00] mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              主题
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`
                    p-3 rounded-lg border text-center transition-all
                    ${
                      theme === t.value
                        ? 'border-opacity-50 bg-opacity-10'
                        : 'bg-[#1E293B] border-[#334155] text-gray-400 hover:border-opacity-30'
                    }
                  `}
                  style={
                    theme === t.value
                      ? {
                          backgroundColor: `${t.color}15`,
                          borderColor: `${t.color}80`,
                          color: t.color,
                        }
                      : undefined
                  }
                >
                  <div
                    className="w-6 h-6 rounded-full mx-auto mb-1.5 border-2"
                    style={{
                      backgroundColor: t.color,
                      borderColor: theme === t.value ? t.color : '#334155',
                    }}
                  />
                  <p className="text-sm font-medium">{t.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1E293B] flex items-center justify-between">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-[#FFFF00] bg-[#1E293B] hover:bg-[#334155] rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            恢复默认
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#0A1929] bg-[#00FFFF] hover:bg-[#00CCCC] rounded-lg font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
