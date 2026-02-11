import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'cyberpunk' | 'dark' | 'light';
export type PerformanceMode = 'high' | 'balanced' | 'performance';

interface SettingsStore {
  // Display settings
  showParticles: boolean;
  showGridFloor: boolean;
  enableAnimations: boolean;

  // Performance
  performanceMode: PerformanceMode;

  // Theme
  theme: ThemeMode;

  // Actions
  setShowParticles: (show: boolean) => void;
  setShowGridFloor: (show: boolean) => void;
  setEnableAnimations: (enable: boolean) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  setTheme: (theme: ThemeMode) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS = {
  showParticles: true,
  showGridFloor: true,
  enableAnimations: true,
  performanceMode: 'balanced' as PerformanceMode,
  theme: 'cyberpunk' as ThemeMode,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setShowParticles: (showParticles) => set({ showParticles }),
      setShowGridFloor: (showGridFloor) => set({ showGridFloor }),
      setEnableAnimations: (enableAnimations) => set({ enableAnimations }),
      setPerformanceMode: (performanceMode) => set({ performanceMode }),
      setTheme: (theme) => set({ theme }),
      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'knowgraph-settings',
    }
  )
);
