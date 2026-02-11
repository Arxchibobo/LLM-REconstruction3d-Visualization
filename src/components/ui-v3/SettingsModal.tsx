'use client';

import { X } from 'lucide-react';
import { useSettingsStore, PerformanceMode, ThemeMode } from '@/stores/useSettingsStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { getTranslation } from '@/i18n/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? 'bg-[#00FFFF]' : 'bg-[#334155]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    showParticles,
    setShowParticles,
    showGridFloor,
    setShowGridFloor,
    enableAnimations,
    setEnableAnimations,
    performanceMode,
    setPerformanceMode,
    theme,
    setTheme,
  } = useSettingsStore();

  const { language } = useLanguageStore();

  // Translation helper
  const t = (key: string) => getTranslation(language, key);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl shadow-[#00FFFF]/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#00FFFF]/10 to-[#FF00FF]/10 border-b border-[#1E293B]">
          <h2 className="text-lg font-semibold text-white">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Visual Effects */}
          <div>
            <h3 className="text-sm font-semibold text-[#00FFFF] mb-4">{t('settings.visualEffects')}</h3>
            <div className="space-y-4">
              {/* Particle Effects */}
              <div className="flex items-center justify-between p-4 bg-[#1E293B] rounded-lg hover:bg-[#243447] transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{t('settings.particleEffects')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('settings.particleDesc')}</p>
                </div>
                <Toggle checked={showParticles} onChange={setShowParticles} />
              </div>

              {/* Grid Floor */}
              <div className="flex items-center justify-between p-4 bg-[#1E293B] rounded-lg hover:bg-[#243447] transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{t('settings.gridFloor')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('settings.gridDesc')}</p>
                </div>
                <Toggle checked={showGridFloor} onChange={setShowGridFloor} />
              </div>

              {/* Enable Animations */}
              <div className="flex items-center justify-between p-4 bg-[#1E293B] rounded-lg hover:bg-[#243447] transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{t('settings.enableAnimations')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('settings.animationsDesc')}</p>
                </div>
                <Toggle checked={enableAnimations} onChange={setEnableAnimations} />
              </div>
            </div>
          </div>

          {/* Performance */}
          <div>
            <h3 className="text-sm font-semibold text-[#00FFFF] mb-4">{t('settings.performance')}</h3>
            <div className="p-4 bg-[#1E293B] rounded-lg">
              <p className="text-sm font-medium text-white mb-3">{t('settings.performanceMode')}</p>
              <div className="grid grid-cols-3 gap-2">
                {(['high', 'balanced', 'low'] as PerformanceMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPerformanceMode(mode)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      performanceMode === mode
                        ? 'bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/50'
                        : 'bg-[#334155] text-gray-400 hover:text-white hover:bg-[#3D4B5F]'
                    }`}
                  >
                    {t(`settings.performance${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h3 className="text-sm font-semibold text-[#00FFFF] mb-4">{t('settings.appearance')}</h3>
            <div className="p-4 bg-[#1E293B] rounded-lg">
              <p className="text-sm font-medium text-white mb-3">{t('settings.themeMode')}</p>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'auto'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      theme === mode
                        ? 'bg-[#FF00FF]/20 text-[#FF00FF] border border-[#FF00FF]/50'
                        : 'bg-[#334155] text-gray-400 hover:text-white hover:bg-[#3D4B5F]'
                    }`}
                  >
                    {t(`settings.theme${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1E293B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-[#1E293B] hover:bg-[#334155] rounded-lg transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
