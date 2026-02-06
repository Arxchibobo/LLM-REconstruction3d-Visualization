import { KnowledgeNode } from '@/types/knowledge';
import { ProjectFile } from '@/services/project-structure/ProjectStructureService';

/**
 * 项目结构布局算法
 *
 * 采用分层轨道布局:
 * - 中心 (radius = 0): src/ 根节点
 * - 第一层 (radius = 5): 主要目录 (app, components, services, stores, utils, types)
 * - 第二层 (radius = 10): 核心文件 (importance > 0.7)
 * - 第三层 (radius = 15): 普通文件 (importance <= 0.7)
 */

export interface LayoutConfig {
  centerRadius: number;        // 中心半径
  layer1Radius: number;         // 第一层半径
  layer2Radius: number;         // 第二层半径
  layer3Radius: number;         // 第三层半径
  verticalSpread: number;       // 垂直分散度
  groupSpacing: number;         // 组间距
}

const DEFAULT_CONFIG: LayoutConfig = {
  centerRadius: 0,
  layer1Radius: 5,
  layer2Radius: 10,
  layer3Radius: 15,
  verticalSpread: 2,
  groupSpacing: 0.5,
};

/**
 * 计算项目文件的 3D 位置
 */
export function calculateProjectLayout(
  files: ProjectFile[],
  config: LayoutConfig = DEFAULT_CONFIG
): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();

  // 1. 分组文件
  const groups = groupFilesByDirectory(files);

  // 2. 创建虚拟根节点 (src/)
  positions.set('__root__', [0, 0, 0]);

  // 3. 布局主要目录 (第一层)
  const mainDirs = ['app', 'components', 'services', 'stores', 'utils', 'types'];
  layoutMainDirectories(mainDirs, config, positions);

  // 4. 布局文件 (第二层和第三层)
  layoutFilesByImportance(files, groups, config, positions);

  return positions;
}

/**
 * 按目录分组文件
 */
function groupFilesByDirectory(files: ProjectFile[]): Map<string, ProjectFile[]> {
  const groups = new Map<string, ProjectFile[]>();

  for (const file of files) {
    const dir = file.category; // category 就是第一级目录
    const existing = groups.get(dir) || [];
    existing.push(file);
    groups.set(dir, existing);
  }

  return groups;
}

/**
 * 布局主要目录 (第一层 - 轨道布局)
 */
function layoutMainDirectories(
  dirs: string[],
  config: LayoutConfig,
  positions: Map<string, [number, number, number]>
): void {
  const radius = config.layer1Radius;
  const count = dirs.length;

  dirs.forEach((dir, index) => {
    const angle = (index / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0; // 主目录在同一水平面

    positions.set(`__dir_${dir}__`, [x, y, z]);
  });
}

/**
 * 按重要性布局文件 (第二层和第三层)
 */
function layoutFilesByImportance(
  files: ProjectFile[],
  groups: Map<string, ProjectFile[]>,
  config: LayoutConfig,
  positions: Map<string, [number, number, number]>
): void {
  // 按目录分组处理
  for (const [dir, dirFiles] of groups) {
    // 获取目录中心位置
    const dirPos = positions.get(`__dir_${dir}__`);
    if (!dirPos) {
      // 如果目录不在第一层,使用默认位置
      layoutFilesInGroup(dirFiles, [0, 0, 0], config, positions);
      continue;
    }

    // 在目录周围布局文件
    layoutFilesInGroup(dirFiles, dirPos, config, positions);
  }
}

/**
 * 在目录周围布局文件
 */
function layoutFilesInGroup(
  files: ProjectFile[],
  centerPos: [number, number, number],
  config: LayoutConfig,
  positions: Map<string, [number, number, number]>
): void {
  // 按重要性分为两组
  const coreFiles = files.filter(f => f.importance > 0.7); // 核心文件
  const normalFiles = files.filter(f => f.importance <= 0.7); // 普通文件

  // 布局核心文件 (第二层 - 靠近目录中心)
  layoutFilesInRing(coreFiles, centerPos, config.layer2Radius, config, positions);

  // 布局普通文件 (第三层 - 远离目录中心)
  layoutFilesInRing(normalFiles, centerPos, config.layer3Radius, config, positions);
}

/**
 * 在环形轨道上布局文件
 */
function layoutFilesInRing(
  files: ProjectFile[],
  centerPos: [number, number, number],
  radius: number,
  config: LayoutConfig,
  positions: Map<string, [number, number, number]>
): void {
  const count = files.length;
  if (count === 0) return;

  // 按重要性排序 (重要的文件放在更显眼的位置)
  const sortedFiles = [...files].sort((a, b) => b.importance - a.importance);

  sortedFiles.forEach((file, index) => {
    const angle = (index / count) * Math.PI * 2;

    // 相对于目录中心的位置
    const relativeX = Math.cos(angle) * radius;
    const relativeZ = Math.sin(angle) * radius;

    // 垂直位置 (根据重要性和索引添加一些变化)
    const relativeY = (Math.sin(index * 0.5) * config.verticalSpread) - 1;

    // 绝对位置
    const x = centerPos[0] + relativeX;
    const y = centerPos[1] + relativeY;
    const z = centerPos[2] + relativeZ;

    positions.set(file.id, [x, y, z]);
  });
}

/**
 * 将 ProjectFile 转换为 KnowledgeNode
 */
export function convertProjectFilesToNodes(
  files: ProjectFile[],
  positions: Map<string, [number, number, number]>
): KnowledgeNode[] {
  const nodes: KnowledgeNode[] = [];

  // 添加虚拟根节点
  const rootPos = positions.get('__root__') || [0, 0, 0];
  nodes.push({
    id: '__root__',
    type: 'folder',
    title: 'src/',
    description: '项目根目录',
    filePath: 'src/',
    content: '',
    tags: ['root'],
    links: [],
    position: rootPos,
    tier: 'CoreSkill',
    orbit: 1,
    metadata: {
      size: 1000,
      created: new Date(),
      modified: new Date(),
      accessed: new Date(),
      accessCount: 0,
      importance: 1.0,
    },
    visual: {
      color: '#FFFFFF',
      size: 1.5,
      shape: 'sphere',
      glow: true,
      icon: '📁',
    },
  });

  // 添加文件节点
  for (const file of files) {
    const pos = positions.get(file.id) || [0, 0, 0];

    // 根据重要性确定层级
    const tier = file.importance > 0.7 ? 'CoreSkill' : file.importance > 0.4 ? 'Skill' : 'Item';

    // 根据重要性确定轨道
    const orbit = file.importance > 0.7 ? 1 : file.importance > 0.4 ? 2 : 3;

    // 根据文件类型选择形状
    const shape = getShapeByType(file.type);

    nodes.push({
      id: file.id,
      type: file.type,
      title: file.name,
      description: file.description,
      filePath: file.path,
      content: `Lines: ${file.lines}\nImports: ${file.imports.length}\nExported by: ${file.exportedBy.length}`,
      tags: [file.type, file.category],
      links: file.imports,
      position: pos,
      tier,
      orbit: orbit as 1 | 2 | 3,
      metadata: {
        size: file.lines,
        created: new Date(),
        modified: new Date(),
        accessed: new Date(),
        accessCount: file.exportedBy.length,
        importance: file.importance,
      },
      visual: {
        color: '#FFFFFF', // 颜色将由 colors.ts 的 getColorByType 决定
        size: 0.5 + file.importance * 0.5, // 0.5 - 1.0
        shape,
        glow: file.importance > 0.7,
        icon: getIconByType(file.type),
      },
    });
  }

  return nodes;
}

/**
 * 根据文件类型选择 3D 形状
 */
function getShapeByType(type: string): 'sphere' | 'cube' | 'cylinder' | 'octahedron' | 'torus' | 'dodecahedron' {
  const shapeMap: Record<string, any> = {
    'page': 'cube',              // 页面 - 方形 (结构化)
    'api-route': 'cylinder',     // API - 柱形 (管道)
    'component-scene': 'octahedron', // 场景组件 - 八面体 (3D)
    'component-ui': 'sphere',    // UI 组件 - 球形 (通用)
    'service': 'torus',          // 服务 - 环形 (连接)
    'store': 'dodecahedron',     // Store - 十二面体 (复杂)
    'util': 'sphere',            // 工具 - 球形
    'type-def': 'octahedron',    // 类型 - 八面体
    'folder': 'cube',            // 文件夹 - 立方体
  };

  return shapeMap[type] || 'sphere';
}

/**
 * 根据文件类型选择图标
 */
function getIconByType(type: string): string {
  const iconMap: Record<string, string> = {
    'page': '📄',
    'api-route': '🔌',
    'component-scene': '🎬',
    'component-ui': '🎨',
    'service': '⚙️',
    'store': '📦',
    'util': '🔧',
    'type-def': '📝',
    'folder': '📁',
  };

  return iconMap[type] || '📄';
}

/**
 * 创建依赖连接
 */
export function createDependencyConnections(files: ProjectFile[]): any[] {
  const connections: any[] = [];

  for (const file of files) {
    for (const importPath of file.imports) {
      connections.push({
        id: `${file.id}->${importPath}`,
        source: file.id,
        target: importPath,
        type: 'import',
        strength: 0.8,
        label: 'imports',
        metadata: {
          created: new Date(),
          manual: false,
        },
        visual: {
          color: '#00FFFF',
          width: 0.5,
          dashed: false,
          animated: true,
        },
      });
    }
  }

  return connections;
}
