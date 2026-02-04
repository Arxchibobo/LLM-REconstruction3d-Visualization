# Quick Reference - Reconstruction 3D 优化指南

> 快速了解新的适配器系统和工程化改进

---

## 🚀 适配器系统使用指南

### 基本概念

**适配器（Adapter）** = 数据源的统一接口
- 每个数据源（Claude Config、Project Structure 等）实现 `DataSourceAdapter` 接口
- 核心代码无需关心数据来源，统一调用适配器

### 快速开始

#### 1. 使用现有适配器

```typescript
import { getAdapter } from '@/adapters';

// 获取 Claude Config 适配器
const adapter = getAdapter('claude-config');

// 获取数据
const data = await adapter.fetchData();
console.log(data.nodes, data.connections);

// 获取统计信息
if (adapter.getStatistics) {
  const stats = await adapter.getStatistics();
  console.log(`节点数: ${stats.nodeCount}`);
}
```

#### 2. 在组件中使用

```typescript
'use client';
import { useDataSourceStore } from '@/stores/useDataSourceStore';
import { useEffect } from 'react';

export default function MyComponent() {
  const { data, isLoading, error, loadData, switchAdapter } = useDataSourceStore();

  useEffect(() => {
    loadData(); // 首次加载数据
  }, [loadData]);

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <button onClick={() => switchAdapter('project-structure')}>
        切换到项目结构
      </button>
      <div>节点数量: {data?.nodes.length}</div>
    </div>
  );
}
```

---

## 🔧 创建自定义适配器

### 步骤 1: 创建适配器类

```typescript
// src/adapters/my-custom-adapter.ts
import { BaseAdapter, AdapterConfig } from './base';
import type { KnowledgeGraphData, KnowledgeNode } from '@/types/knowledge';

export class MyCustomAdapter extends BaseAdapter {
  readonly name = 'my-custom';
  readonly displayName = 'My Custom Data Source';
  readonly description = 'Description of my data source';
  readonly sourceType = 'api' as const; // 或 'file' / 'memory'

  async fetchData(): Promise<KnowledgeGraphData> {
    // 实现数据获取逻辑
    const response = await fetch('/api/my-data');
    const rawData = await response.json();

    return {
      nodes: rawData.items.map(item => this.parseNode(item)),
      connections: this.generateConnections(rawData)
    };
  }

  parseNode(raw: any): KnowledgeNode {
    return {
      id: `custom-${raw.id}`,
      type: 'custom-type',
      data: {
        title: raw.name,
        description: raw.desc,
        category: raw.category
      }
    };
  }

  parseConnection(raw: any) {
    return {
      source: raw.from,
      target: raw.to,
      type: 'custom-relation'
    };
  }
}
```

### 步骤 2: 注册适配器

```typescript
// src/adapters/index.ts
import { MyCustomAdapter } from './my-custom-adapter';

adapterRegistry.register('my-custom', (config) => new MyCustomAdapter(config));
```

### 步骤 3: 使用新适配器

```typescript
// 在任何地方使用
const adapter = getAdapter('my-custom');
const data = await adapter.fetchData();

// 或通过 Store 切换
useDataSourceStore.getState().switchAdapter('my-custom');
```

---

## 📊 Store 使用指南

### 新的 Store 结构

| Store | 职责 | 文件 |
|-------|------|------|
| **useDataSourceStore** | 管理数据源和图谱数据 | `stores/useDataSourceStore.ts` ✨新增 |
| **useKnowledgeStore** | 管理 UI 状态（选中、悬停等） | `stores/useKnowledgeStore.ts` |

### useDataSourceStore API

```typescript
const {
  // 状态
  currentAdapter,     // 当前适配器名称
  availableAdapters,  // 可用适配器列表
  data,               // 知识图谱数据
  isLoading,          // 加载状态
  error,              // 错误信息
  statistics,         // 统计信息

  // Actions
  switchAdapter,      // 切换适配器
  refreshData,        // 刷新数据
  loadData,           // 加载数据
  clearError          // 清除错误
} = useDataSourceStore();
```

### 便捷 Hooks

```typescript
import {
  useCurrentAdapter,    // 获取当前适配器实例
  useDataLoadingState,  // 获取加载状态
  useDataStatistics     // 获取统计信息
} from '@/stores/useDataSourceStore';

// 使用示例
const adapter = useCurrentAdapter();
const { isLoading, error, hasData } = useDataLoadingState();
const stats = useDataStatistics();
```

---

## 🎨 模板系统（即将推出）

### 可视化预设

```typescript
// 未来将支持快速切换可视化风格
import { applyVisualizationPreset } from '@/templates';

applyVisualizationPreset('tech-orbital');    // 科技轨道风格
applyVisualizationPreset('minimal-force');   // 极简力导向
applyVisualizationPreset('hierarchical');    // 层次树状
```

### 节点样式模板

```typescript
// 未来将支持预设节点样式
import { nodeStyleTemplates } from '@/templates';

const sphereStyle = nodeStyleTemplates['tech-sphere'];
const cubeStyle = nodeStyleTemplates['data-cube'];
```

---

## 📁 项目结构（更新后）

```
reconstruction-3d/
├── src/
│   ├── adapters/               ✨ 新增：适配器系统
│   │   ├── base.ts            # 适配器基类和接口
│   │   ├── claude-config-adapter.ts
│   │   ├── project-structure-adapter.ts
│   │   └── index.ts           # 统一导出
│   │
│   ├── stores/
│   │   ├── useDataSourceStore.ts  ✨ 新增：数据源 Store
│   │   └── useKnowledgeStore.ts   # UI 状态 Store
│   │
│   ├── templates/              🔜 即将推出：模板系统
│   │   ├── node-styles.ts
│   │   ├── layout-algorithms.ts
│   │   └── color-schemes.ts
│   │
│   └── ...
│
└── docs/                       ✨ 新增：文档系统
    ├── OPTIMIZATION_PLAN.md   # 完整优化方案
    ├── QUICK_REFERENCE.md     # 本文档
    └── ...
```

---

## 🔍 故障排查

### 适配器加载失败

```typescript
// 检查适配器是否注册
import { hasAdapter, listAdapters } from '@/adapters';

console.log('可用适配器:', listAdapters());
console.log('claude-config 已注册?', hasAdapter('claude-config'));
```

### 数据加载错误

```typescript
const { error, clearError } = useDataSourceStore();

if (error) {
  console.error('错误详情:', error.message);
  clearError(); // 清除错误后重试
}
```

### 缓存问题

```typescript
// 强制刷新数据（清除缓存）
const { refreshData } = useDataSourceStore();
await refreshData();
```

---

## 🚦 迁移指南

### 从旧 API 迁移

| 旧方式 | 新方式 |
|--------|--------|
| `fetch('/api/claude-config')` | `getAdapter('claude-config').fetchData()` |
| 直接解析 JSON | 适配器自动解析 |
| 手动缓存 | 适配器内置缓存 |

### 代码示例

**旧方式**:
```typescript
const response = await fetch('/api/claude-config');
const rawData = await response.json();
const nodes = rawData.skills.map(skill => ({
  id: skill.name,
  type: 'skill',
  // ...
}));
```

**新方式**:
```typescript
const adapter = getAdapter('claude-config');
const { nodes, connections } = await adapter.fetchData();
// 数据已标准化，直接使用
```

---

## 📞 获取帮助

- **完整文档**: [docs/OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)
- **API 文档**: [docs/api/ADAPTERS.md](./api/ADAPTERS.md)（即将推出）
- **问题反馈**: GitHub Issues

---

**最后更新**: 2026-02-04
**当前版本**: v0.3.0（适配器系统）
**下一阶段**: v0.4.0（模板系统）
