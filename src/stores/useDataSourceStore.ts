/**
 * Data Source Store
 *
 * 管理数据源适配器和知识图谱数据
 * 分离数据获取逻辑与UI状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAdapter, listAdapters, type DataSourceAdapter } from '@/adapters';
import type { KnowledgeGraph } from '@/types/knowledge';

interface DataSourceState {
  // 当前适配器
  currentAdapter: string;
  availableAdapters: ReturnType<typeof listAdapters>;

  // 数据
  data: KnowledgeGraph | null;
  isLoading: boolean;
  error: Error | null;

  // 统计信息
  statistics: {
    nodeCount: number;
    connectionCount: number;
    categories: string[];
    lastUpdated?: Date;
  } | null;

  // Actions
  switchAdapter: (name: string) => Promise<void>;
  refreshData: () => Promise<void>;
  loadData: () => Promise<void>;
  clearError: () => void;
}

export const useDataSourceStore = create<DataSourceState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentAdapter: 'claude-config',
      availableAdapters: listAdapters(),
      data: null,
      isLoading: false,
      error: null,
      statistics: null,

      // 切换适配器
      switchAdapter: async (name: string) => {
        set({ isLoading: true, error: null });

        try {
          const adapter = getAdapter(name);
          const data = await adapter.fetchData();

          // 获取统计信息（如果适配器支持）
          let statistics = null;
          if (adapter.getStatistics) {
            statistics = await adapter.getStatistics();
          }

          set({
            currentAdapter: name,
            data,
            statistics,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error as Error,
            isLoading: false
          });
          console.error('[DataSourceStore] Failed to switch adapter:', error);
        }
      },

      // 刷新当前数据源
      refreshData: async () => {
        const { currentAdapter } = get();
        set({ isLoading: true, error: null });

        try {
          const adapter = getAdapter(currentAdapter);

          // 调用适配器的 refresh 方法（如果有）
          if (adapter.refresh) {
            await adapter.refresh();
          }

          // 重新获取数据
          const data = await adapter.fetchData();
          let statistics = null;
          if (adapter.getStatistics) {
            statistics = await adapter.getStatistics();
          }

          set({
            data,
            statistics,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error as Error,
            isLoading: false
          });
          console.error('[DataSourceStore] Failed to refresh data:', error);
        }
      },

      // 加载数据（首次加载或手动触发）
      loadData: async () => {
        const { currentAdapter, data } = get();

        // 如果已有数据，跳过加载
        if (data) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const adapter = getAdapter(currentAdapter);
          const newData = await adapter.fetchData();

          let statistics = null;
          if (adapter.getStatistics) {
            statistics = await adapter.getStatistics();
          }

          set({
            data: newData,
            statistics,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error as Error,
            isLoading: false
          });
          console.error('[DataSourceStore] Failed to load data:', error);
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'reconstruction-3d-data-source',
      // 只持久化适配器选择，数据每次重新加载
      partialize: (state) => ({
        currentAdapter: state.currentAdapter
      })
    }
  )
);

/**
 * 便捷 Hooks
 */

// 获取当前适配器实例
export function useCurrentAdapter(): DataSourceAdapter | null {
  const currentAdapter = useDataSourceStore((state) => state.currentAdapter);
  try {
    return getAdapter(currentAdapter);
  } catch {
    return null;
  }
}

// 获取数据加载状态
export function useDataLoadingState() {
  return useDataSourceStore((state) => ({
    isLoading: state.isLoading,
    error: state.error,
    hasData: !!state.data
  }));
}

// 获取统计信息
export function useDataStatistics() {
  return useDataSourceStore((state) => state.statistics);
}
