# 3D Workspace Session Manager — 实现计划

> **目标**: 新建 `/workspace` 页面，用户可在三维画布中创建多个 Session，
> 拖拽 Skill/Plugin/MCP 等模块到 Session 中，输入需求，获得实时模块推荐。

---

## 一、架构总览

```
/workspace (新路由)
┌─────────────────────────────────────────────────────────┐
│ WorkspaceTopBar  [← 返回/v3]  [+ 新建Session]  [搜索]  │
├──────────┬──────────────────────────────┬───────────────┤
│ Module   │                              │ Session       │
│ Palette  │     3D Canvas                │ Panel         │
│          │     (R3F)                    │               │
│ ┌──────┐ │   ┌─────────┐ ┌─────────┐   │ ┌───────────┐ │
│ │Skill │ │   │Session 1│ │Session 2│   │ │ 名称      │ │
│ │MCP   │ │   │ ○ ○ ○   │ │ ○ ○     │   │ │ 需求输入  │ │
│ │Plugin│ │   │ ○ ○     │ │ ○ ○ ○   │   │ │ 模块列表  │ │
│ │Hook  │ │   └─────────┘ └─────────┘   │ │ 推荐      │ │
│ │Rule  │ │                              │ │ [开始]    │ │
│ │Agent │ │       ┌─────────┐            │ └───────────┘ │
│ └──────┘ │       │Session 3│            │               │
│          │       │ ○       │            │               │
│          │       └─────────┘            │               │
├──────────┴──────────────────────────────┴───────────────┤
│ WorkspaceStatusBar  Sessions: 3 | Modules: 12 | Ready   │
└─────────────────────────────────────────────────────────┘
```

**关键交互流程**:
1. 左侧 Palette → HTML5 Drag 模块 → 拖到 3D Canvas → Raycast 落点
2. 落在已有 Session 上 → 模块加入该 Session
3. 落在空白处 → 弹出 CreateSessionDialog → 创建新 Session 并加入模块
4. 选中 Session → 右侧面板展示详情/输入需求 → 实时推荐模块
5. 模块齐全+需求填写 → 点击"开始" → Session 状态变为 running

---

## 二、新增类型定义

**文件**: `src/types/workspace.ts`

```typescript
// === 模块类型（Palette 中可拖拽的单元） ===
export type ModuleType = 'skill' | 'mcp' | 'plugin' | 'hook' | 'rule' | 'agent' | 'memory';

export interface WorkspaceModule {
  id: string;                    // "skill-commit", "mcp-playwright" 等
  type: ModuleType;
  name: string;
  description: string;
  tags: string[];                // 用于推荐匹配
  enabled: boolean;
  icon: string;                  // Lucide icon 名称
}

// === Session 状态机 ===
export type SessionStatus = 'drafting' | 'ready' | 'running' | 'completed' | 'failed';

export interface Session {
  id: string;                    // crypto.randomUUID()
  name: string;
  description: string;           // 用户输入的需求
  moduleIds: string[];           // WorkspaceModule.id 引用
  status: SessionStatus;
  position: [number, number, number];  // 3D 世界坐标（Session 中心）
  color: string;                 // 自动分配的霓虹色
  createdAt: number;
  updatedAt: number;
  result?: string;               // 完成后的结果摘要
}

// === 推荐 ===
export interface ModuleRecommendation {
  moduleId: string;
  score: number;                 // 0-1
  reason: string;
}

// === 拖拽状态 ===
export interface DragState {
  isDragging: boolean;
  draggedModule: WorkspaceModule | null;
  dropTarget: string | null;     // sessionId | 'canvas-empty'
  worldPosition: [number, number, number] | null;
}
```

---

## 三、新增 Zustand Store

**文件**: `src/stores/useWorkspaceStore.ts`

### 状态

| 字段 | 类型 | 说明 | 持久化 |
|------|------|------|--------|
| `modules` | `WorkspaceModule[]` | 所有可用模块（从 API 加载） | No |
| `modulesLoading` | `boolean` | 加载状态 | No |
| `sessions` | `Session[]` | 所有 Session | **Yes** (localStorage) |
| `selectedSessionId` | `string \| null` | 当前选中的 Session | No |
| `dragState` | `DragState` | 拖拽中间状态 | No |
| `recommendations` | `ModuleRecommendation[]` | 当前 Session 的推荐 | No |
| `paletteOpen` | `boolean` | 左侧面板开关 | No |
| `paletteSearch` | `string` | 搜索关键词 | No |
| `paletteFilter` | `ModuleType \| null` | 类型过滤 | No |

### 核心 Actions

```typescript
// 模块加载
loadModules(): Promise<void>  // 调用 /api/claude-config → 扁平化为 WorkspaceModule[]

// Session CRUD
createSession(name: string, description?: string): string  // 返回 sessionId
deleteSession(sessionId: string): void
updateSession(sessionId: string, updates: Partial<Session>): void
setSelectedSession(sessionId: string | null): void
setSessionStatus(sessionId: string, status: SessionStatus): void

// 模块 ↔ Session
addModuleToSession(sessionId: string, moduleId: string): void
removeModuleFromSession(sessionId: string, moduleId: string): void

// 拖拽
startDrag(module: WorkspaceModule): void
updateDragWorldPosition(pos: [number, number, number]): void
setDropTarget(target: string | null): void
endDrag(): void
executeDrop(): void  // 根据 dropTarget 执行 addModule 或 createSession+addModule

// 推荐
computeRecommendations(sessionId: string): void  // 基于 description + 已有模块 → 关键词匹配

// 计算属性
getSessionModules(sessionId: string): WorkspaceModule[]  // 返回完整模块对象
getFilteredPaletteModules(): WorkspaceModule[]  // 搜索+过滤后的模块列表
```

### 持久化策略

```typescript
persist(storeCreator, {
  name: 'workspace-sessions-v1',
  partialize: (state) => ({
    sessions: state.sessions,
  }),
})
```

只持久化 `sessions`。模块每次从 API 重新加载，保证数据新鲜。

### Session 自动布局

创建新 Session 时自动分配位置：
- 网格布局，间距 35 单位
- 位于 Y=0 平面（XZ 平面）
- 算法：`sessions.length` → 行列号 → 坐标
- 颜色循环：`['#00FFFF', '#FF00FF', '#FFFF00', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD']`

---

## 四、新增 3D 组件

### 4.1 WorkspaceScene.tsx（主 Canvas）

复用 Scene.tsx 的模式：

```
<Canvas>
  <SpaceBackground />              // 复用现有
  <OrbitControls enabled={!isDragging} />
  <WorkspaceCamera />              // 简化版相机（俯视角度偏好）
  <Suspense>
    <WorkspaceGraph />             // 渲染所有 Session + Module
  </Suspense>
  <GroundPlane />                  // 用于 Raycast 的隐形地面
  <DragPreview />                  // 拖拽时的幽灵模块
  <EffectComposer>
    <Bloom intensity={0.5} luminanceThreshold={0.8} />
    <ToneMapping mode={REINHARD} />
  </EffectComposer>
</Canvas>
```

### 4.2 SessionZone.tsx（Session 3D 区域）

视觉设计：
- **平台**: `CylinderGeometry(radius=12, height=0.15)` 半透明深色
- **边框环**: `TorusGeometry(radius=12, tube=0.08)` 霓虹色发光
- **标题**: `@react-three/drei Html` 浮于平台上方
- **状态指示**: 边框颜色映射 `drafting→青 | ready→绿 | running→蓝(脉冲) | completed→金`
- **选中态**: `@react-spring/three` 弹性放大 1.05x + 边框增亮
- **悬停态**: 边框微亮 + 鼠标 pointer

交互：
- `onClick` → `setSelectedSession(id)`
- `onPointerEnter/Leave` → 高亮 + 拖拽时设置 dropTarget

### 4.3 ModuleNode.tsx（模块 3D 节点）

视觉设计：
- 复用 `NODE_TYPE_SHAPES` 映射（skill→torus, mcp→cylinder, plugin→dodecahedron...）
- 复用 `NODE_TYPE_COLORS` 配色
- 尺寸缩小：base size 0.5（vs PlanetNode 0.8）
- `Billboard` 标签显示模块名
- 简化着色器（纯色发光，不需要行星表面纹理）

布局（Session 内部）：
- 1 个模块：Session 中心偏移 (0, 0.8, 0)
- 2-6 个：圆形排列 radius=5
- 7-10 个：双环（内环 radius=4, 外环 radius=8）

### 4.4 GroundPlane.tsx（Raycast 接收面）

- 不可见的 `PlaneGeometry(500, 500)` 位于 Y=0
- `onPointerMove` 实时更新 raycast 世界坐标（仅在拖拽时）
- `onPointerUp` 执行 drop

### 4.5 DragPreview.tsx（拖拽幽灵）

- 当 `dragState.isDragging` 时渲染
- 在 `dragState.worldPosition` 处显示半透明模块节点
- 跟随鼠标在地面上的投影移动

### 4.6 SessionConnections.tsx（Session 内连线）

- Session 内所有模块 → Session 中心的连线
- 使用 `QuadraticBezierLine`（复用现有模式）
- 颜色跟随 Session 的 accent color，半透明

---

## 五、新增 UI 组件

### 5.1 ModulePalette.tsx（左侧模块面板）

```
┌──────────────────────┐
│ 🔍 搜索模块...       │
├──────────────────────┤
│ [All][Skill][MCP]... │  ← 类型过滤 Pills
├──────────────────────┤
│ ▼ Skills (81)        │
│   ┌────────────────┐ │
│   │ 🟢 commit      │ │  ← draggable
│   │ 🟢 code-review │ │
│   │ 🟢 write-tests │ │
│   └────────────────┘ │
│ ▼ MCPs (5)           │
│   ┌────────────────┐ │
│   │ 🔵 playwright  │ │
│   │ 🔵 bytebase    │ │
│   └────────────────┘ │
│ ▼ Plugins (12)       │
│ ▼ Hooks (6)          │
│ ▼ Rules (8)          │
│ ▼ Agents (9)         │
│ ▼ Memory (4)         │
└──────────────────────┘
```

- 样式复用 `ModernLeftPanel.tsx` 的赛博朋克风格
- 每个模块 `draggable="true"`
- `onDragStart` → `store.startDrag(module)`
- `onDragEnd` → `store.endDrag()`
- 拖拽时显示自定义 drag image（模块卡片缩略图）

### 5.2 SessionPanel.tsx（右侧 Session 详情）

```
┌──────────────────────┐
│ Session: "API 开发"   │  ← 可编辑名称
├──────────────────────┤
│ 📝 需求描述           │
│ ┌────────────────────┐│
│ │ 我需要实现一个     ││  ← textarea, 输入触发推荐
│ │ RESTful API...     ││
│ └────────────────────┘│
├──────────────────────┤
│ 📦 已加载模块 (3)     │
│   🟢 commit      [×] │
│   🔵 bytebase    [×] │
│   🟡 fastapi-pro [×] │
├──────────────────────┤
│ 💡 推荐模块           │
│  ┌──────────────────┐ │
│  │ 🟢 write-tests   │ │  ← score: 0.8
│  │ "Tags: api, test"│ │
│  │        [+ 添加]  │ │
│  ├──────────────────┤ │
│  │ 🟢 code-review   │ │  ← score: 0.6
│  │        [+ 添加]  │ │
│  └──────────────────┘ │
├──────────────────────┤
│ 状态: Drafting        │
│ [▶ 开始 Session]      │
└──────────────────────┘
```

- 无 Session 选中时显示空状态引导
- 需求输入框 onChange 500ms debounce → `computeRecommendations()`
- "开始 Session" 按钮：status → 'ready' → 'running'

### 5.3 WorkspaceTopBar.tsx

```
┌──────────────────────────────────────────────────────────┐
│ ◀ 3D Graph  │  🧊 Workspace  │  [+ New Session]  │ ⚙️  │
└──────────────────────────────────────────────────────────┘
```

- 左侧：页面切换（`/v3` ↔ `/workspace`），用 Next.js `<Link>`
- 中间：标题
- 右侧：新建 Session 按钮 + 设置

### 5.4 WorkspaceStatusBar.tsx

```
┌──────────────────────────────────────────────────────────┐
│ Sessions: 3  │  Modules: 12  │  Drafting: 1  Running: 2 │
└──────────────────────────────────────────────────────────┘
```

### 5.5 CreateSessionDialog.tsx

- 基于 `@radix-ui/react-dialog`（已在 dependencies）
- 输入：Session 名称（必填）+ 需求描述（选填）
- 确认 → `createSession(name, description)` → 关闭 Dialog

---

## 六、拖拽架构（HTML → 3D）

### 流程图

```
ModulePalette (HTML)          Canvas Container (HTML)         R3F Scene (WebGL)
──────────────                ─────────────────               ──────────────────
onDragStart
  → store.startDrag(module)
  → setDragImage()
                              onDragOver (preventDefault)
                                → getNativeEvent coords
                                → raycast to Y=0 plane
                                → store.updateDragWorldPosition
                                                              DragPreview renders
                                                              at worldPosition

                                                              SessionZone detects
                                                              proximity → highlight
                              onDrop
                                → store.executeDrop()
                                  if dropTarget=session
                                    → addModuleToSession()
                                  if dropTarget=null
                                    → open CreateSessionDialog
                                    → createSession + add
onDragEnd
  → store.endDrag()
```

### Raycast 工具

**文件**: `src/utils/workspaceRaycast.ts`

```typescript
import { Raycaster, Vector2, Vector3, Plane, Camera } from 'three';

const raycaster = new Raycaster();
const groundPlane = new Plane(new Vector3(0, 1, 0), 0);

export function screenToWorld(
  clientX: number, clientY: number,
  canvasRect: DOMRect, camera: Camera
): Vector3 | null {
  const mouse = new Vector2(
    ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
    -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  const target = new Vector3();
  return raycaster.ray.intersectPlane(groundPlane, target) ? target : null;
}

export function findNearestSession(
  worldPos: Vector3,
  sessions: Session[],
  radius: number = 12
): string | null {
  for (const s of sessions) {
    const dist = worldPos.distanceTo(new Vector3(...s.position));
    if (dist <= radius) return s.id;
  }
  return null;
}
```

### 关键处理：OrbitControls 冲突

拖拽期间禁用 OrbitControls：
```tsx
<OrbitControls enabled={!dragState.isDragging} />
```

### 关键处理：相机引用

需要从 R3F Canvas 内部暴露 camera 引用给外部 HTML drop handler。
方案：通过 Zustand store 存一个 `cameraRef`，在 WorkspaceScene 内部通过 `useThree()` 获取后写入 store。

---

## 七、推荐引擎

**文件**: `src/utils/recommendations.ts`

### 算法

```
输入: session.description + session.name + 已有 moduleIds
输出: ModuleRecommendation[] (top 5, score > 0.1)

1. 分词: tokenize(description + name) → Set<keyword>
   - 移除停用词（the, a, is, 的, 是...）
   - 支持中英文

2. 对每个未加入 Session 的模块计算分数:
   a. Tag 匹配 (每个匹配 tag +0.3)      → 最强信号
   b. 模块名包含关键词 (+0.4)             → 直接命中
   c. 模块描述与关键词重叠 (+0.1/词, 上限0.3)
   d. 类型亲和度 (Session 已有同类型 +0.1)

3. 过滤 score > 0.1, 取 top 5, 按 score 降序

触发时机:
  - description textarea onChange (debounced 500ms)
  - addModuleToSession / removeModuleFromSession 后
```

---

## 八、文件结构总览

```
src/
├── app/workspace/
│   └── page.tsx                          # 新页面
├── types/
│   └── workspace.ts                      # 新类型
├── stores/
│   └── useWorkspaceStore.ts              # 新 Store
├── components/
│   ├── workspace-scene/                  # 新 3D 组件
│   │   ├── WorkspaceScene.tsx            # Canvas 主容器
│   │   ├── WorkspaceGraph.tsx            # 渲染编排器
│   │   ├── SessionZone.tsx               # Session 3D 区域
│   │   ├── ModuleNode.tsx                # 模块 3D 节点
│   │   ├── SessionConnections.tsx        # Session 内连线
│   │   ├── GroundPlane.tsx               # Raycast 接收面
│   │   └── DragPreview.tsx               # 拖拽幽灵
│   └── workspace-ui/                     # 新 UI 组件
│       ├── ModulePalette.tsx             # 左侧模块面板
│       ├── SessionPanel.tsx              # 右侧详情面板
│       ├── WorkspaceTopBar.tsx           # 顶部导航
│       ├── WorkspaceStatusBar.tsx        # 底部状态栏
│       ├── CreateSessionDialog.tsx       # 新建 Session 对话框
│       └── RecommendationCard.tsx        # 推荐卡片
├── utils/
│   ├── workspaceLayout.ts                # Session/Module 布局算法
│   ├── workspaceRaycast.ts               # 屏幕坐标 → 世界坐标
│   └── recommendations.ts                # 推荐引擎
```

**新增文件: 17 个**
**修改文件: 1 个** (`ModernTopBar.tsx` — 加导航链接，约 5 行）

---

## 九、实现阶段

### Phase 1: 基础骨架（类型 + Store + 路由）

**前置依赖**: 无

- [ ] 1.1 创建 `src/types/workspace.ts` — 所有类型定义
- [ ] 1.2 创建 `src/stores/useWorkspaceStore.ts` — Store 骨架 + loadModules action
- [ ] 1.3 创建 `src/app/workspace/page.tsx` — 页面框架（无 3D）
- [ ] 1.4 创建 `WorkspaceTopBar.tsx` — 顶部导航
- [ ] 1.5 创建 `WorkspaceStatusBar.tsx` — 底部状态栏
- [ ] 1.6 验证：`npm run dev` → 访问 `/workspace` → 看到骨架 UI

### Phase 2: 模块面板 + Session CRUD

**前置依赖**: Phase 1

- [ ] 2.1 创建 `ModulePalette.tsx` — 左侧面板（搜索 + 过滤 + 分组列表）
- [ ] 2.2 创建 `CreateSessionDialog.tsx` — 新建对话框
- [ ] 2.3 实现 Session CRUD actions（create/delete/update/select）
- [ ] 2.4 创建 `SessionPanel.tsx` — 右侧详情面板（名称 + 描述 + 模块列表）
- [ ] 2.5 实现 localStorage 持久化
- [ ] 2.6 验证：浏览模块 → 创建/删除 Session → 刷新后 Session 保留

### Phase 3: 3D 场景 + Session 可视化

**前置依赖**: Phase 2

- [ ] 3.1 创建 `src/utils/workspaceLayout.ts` — 网格布局 + 圆形模块排列
- [ ] 3.2 创建 `WorkspaceScene.tsx` — R3F Canvas 容器
- [ ] 3.3 创建 `SessionZone.tsx` — Session 3D 平台
- [ ] 3.4 创建 `ModuleNode.tsx` — 模块 3D 节点（简化版 PlanetNode）
- [ ] 3.5 创建 `WorkspaceGraph.tsx` — 编排 Session + Module 渲染
- [ ] 3.6 创建 `SessionConnections.tsx` — Session 内模块连线
- [ ] 3.7 验证：Session 在 3D 空间显示 → 点击选中 → 模块在 Session 内排列

### Phase 4: 拖拽系统

**前置依赖**: Phase 3

- [ ] 4.1 创建 `src/utils/workspaceRaycast.ts` — 坐标转换
- [ ] 4.2 ModulePalette 加 `draggable` + HTML5 Drag API
- [ ] 4.3 workspace/page.tsx 加 `onDragOver` / `onDrop` 处理
- [ ] 4.4 Store 暴露 camera ref（R3F → Zustand → HTML handler）
- [ ] 4.5 创建 `GroundPlane.tsx` — 不可见 Raycast 面
- [ ] 4.6 创建 `DragPreview.tsx` — 幽灵模块跟随
- [ ] 4.7 SessionZone 加拖拽悬停检测（dropTarget 高亮）
- [ ] 4.8 实现 `executeDrop()` — 落入 Session 或创建新 Session
- [ ] 4.9 验证：从面板拖模块 → 3D 幽灵跟随 → 落到 Session → 模块加入

### Phase 5: 推荐引擎 + 页面互通

**前置依赖**: Phase 4

- [ ] 5.1 创建 `src/utils/recommendations.ts` — 关键词匹配推荐算法
- [ ] 5.2 SessionPanel 加推荐区域
- [ ] 5.3 创建 `RecommendationCard.tsx` — 推荐卡片 UI
- [ ] 5.4 description textarea → debounce → computeRecommendations
- [ ] 5.5 ModernTopBar.tsx 加 `/workspace` 导航链接
- [ ] 5.6 验证：输入需求 → 推荐模块出现 → 点击添加 → 推荐更新

### Phase 6: 视觉打磨 + 性能优化

**前置依赖**: Phase 5

- [ ] 6.1 SessionZone 动画：spring 缩放、脉冲边框、状态色
- [ ] 6.2 ModuleNode 发光效果 + 悬停放大
- [ ] 6.3 DragPreview 半透明 + 落点指示器
- [ ] 6.4 Session 状态指示（边框颜色、标题徽章）
- [ ] 6.5 空状态引导 UI（无 Session 时的提示）
- [ ] 6.6 Loading states + 错误处理
- [ ] 6.7 性能：10+ Session 场景测试，必要时 InstancedMesh
- [ ] 6.8 最终验证：`npm run dev` → 完整流程走通 → 视觉确认

---

## 十、技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 拖拽方案 | HTML5 Drag API + Raycast | 跨 HTML/WebGL 域，drei DragControls 无法处理 |
| Session 布局 | Y=0 平面网格 | 符合项目约定（所有布局用 Y=0），简单直观 |
| Module 渲染 | 简化版 PlanetNode | 完整版 400+ 行含复杂着色器，Module 需轻量化 |
| 持久化 | localStorage (zustand persist) | 零基础设施，现有项目模式 |
| 推荐算法 | 客户端关键词匹配 | 200 个模块 + 字符串匹配 <5ms，无需后端 |
| 状态管理 | 独立 Store (useWorkspaceStore) | 与 /v3 的 useKnowledgeStore 完全隔离 |
| Session 区域形状 | 扁平圆柱 + 环形边框 | 与 PlanetNode 球体视觉区分明确 |
| 新增依赖 | **无** | 所有技术栈已在 package.json 中 |

---

## 十一、风险与对策

| 风险 | 对策 |
|------|------|
| HTML Drag + Canvas pointer 事件冲突 | 父 div 处理 dragover/drop，R3F Canvas 处理 pointer |
| 坐标系转换精度 | 使用 Raycaster + 地面 Plane 交点，避免视角依赖 |
| 拖拽期间 OrbitControls 误触发 | `enabled={!isDragging}` 条件禁用 |
| 模块 ID 跨 Session 引用不一致 | modules 每次从 API 加载，Session 只存 moduleIds |
| localStorage 数据迁移 | key 带版本号 `workspace-sessions-v1` |
| 初始化时 modules 未加载完 Session 已渲染 | SessionPanel 显示 skeleton 直到 modules.length > 0 |

---

## 十二、验收标准

- [ ] `/workspace` 页面可正常访问，UI 完整
- [ ] 左侧面板显示所有 skill/mcp/plugin/hook/rule/agent/memory，可搜索过滤
- [ ] 可创建新 Session（名称 + 描述）
- [ ] Session 在 3D 空间以平台形式显示，可点击选中
- [ ] 从面板拖拽模块到 Session 上，3D 实时反馈
- [ ] 拖到空白处弹出新建对话框
- [ ] 选中 Session 右侧面板显示详情，可编辑需求
- [ ] 输入需求后推荐模块自动出现
- [ ] 多个 Session 同时存在不卡顿（≤10 个）
- [ ] 刷新页面 Session 数据保留
- [ ] `/v3` 和 `/workspace` 可互相跳转
- [ ] 整体视觉风格与现有赛博朋克风一致
