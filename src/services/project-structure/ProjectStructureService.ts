import fs from 'fs';
import path from 'path';
import { NodeType } from '@/types/knowledge';

/**
 * 项目文件接口
 */
export interface ProjectFile {
  id: string;              // 唯一标识 (相对路径)
  path: string;            // 完整路径
  name: string;            // 文件名
  type: NodeType;          // 文件类型
  category: string;        // 分类 (用于分组)
  lines: number;           // 代码行数
  imports: string[];       // 导入的文件列表
  exportedBy: string[];    // 被哪些文件导入
  importance: number;      // 重要性分数 (0-1)
  description: string;     // 描述
}

/**
 * 项目结构服务
 * 用于扫描项目文件,解析依赖关系,计算重要性
 */
export class ProjectStructureService {
  private files: Map<string, ProjectFile> = new Map();
  private rootPath: string = '';

  /**
   * 扫描项目目录
   * @param rootPath 项目根目录 (通常是 src/)
   */
  async scanProject(rootPath: string): Promise<void> {
    this.rootPath = rootPath;
    this.files.clear();


    // 递归扫描目录
    await this.scanDirectory(rootPath);

    // 构建反向依赖关系
    this.buildExportedByRelations();

    // 计算所有文件的重要性
    this.calculateAllImportance();

  }

  /**
   * 递归扫描目录
   */
  private async scanDirectory(dirPath: string): Promise<void> {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(this.rootPath, fullPath);

      // 跳过 node_modules, .next, .git 等目录
      if (this.shouldSkip(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        // 递归扫描子目录
        await this.scanDirectory(fullPath);
      } else if (entry.isFile()) {
        // 解析文件
        const fileInfo = await this.parseFile(fullPath, relativePath);
        if (fileInfo) {
          this.files.set(relativePath, fileInfo);
        }
      }
    }
  }

  /**
   * 解析单个文件
   */
  private async parseFile(
    fullPath: string,
    relativePath: string
  ): Promise<ProjectFile | null> {
    // 只处理 TypeScript 和 JavaScript 文件
    const ext = path.extname(fullPath);
    if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      return null;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n').length;
      const type = this.identifyFileType(relativePath);
      const category = this.getCategory(relativePath);
      const imports = this.parseImports(content, relativePath);

      return {
        id: relativePath,
        path: fullPath,
        name: path.basename(fullPath),
        type,
        category,
        lines,
        imports,
        exportedBy: [],
        importance: 0,
        description: this.generateDescription(type, relativePath)
      };
    } catch (error) {
      console.error('解析文件失败:', fullPath, error);
      return null;
    }
  }

  /**
   * 识别文件类型
   */
  private identifyFileType(relativePath: string): NodeType {
    const normalizedPath = relativePath.replace(/\\/g, '/');

    // Next.js 页面
    if (normalizedPath.includes('/app/') &&
        (normalizedPath.endsWith('page.tsx') || normalizedPath.endsWith('layout.tsx'))) {
      return 'page';
    }

    // API 路由
    if (normalizedPath.includes('/app/api/') || normalizedPath.endsWith('route.ts')) {
      return 'api-route';
    }

    // 场景组件
    if (normalizedPath.includes('/components/scene/')) {
      return 'component-scene';
    }

    // UI 组件
    if (normalizedPath.includes('/components/ui')) {
      return 'component-ui';
    }

    // 服务层
    if (normalizedPath.includes('/services/')) {
      return 'service';
    }

    // 状态管理
    if (normalizedPath.includes('/stores/')) {
      return 'store';
    }

    // 工具函数
    if (normalizedPath.includes('/utils/')) {
      return 'util';
    }

    // 类型定义
    if (normalizedPath.includes('/types/')) {
      return 'type-def';
    }

    // 默认为文档
    return 'document';
  }

  /**
   * 获取文件分类
   */
  private getCategory(relativePath: string): string {
    const parts = relativePath.split(path.sep);

    // 第一级目录作为分类
    if (parts.length > 0) {
      return parts[0];
    }

    return 'root';
  }

  /**
   * 解析 import 语句
   */
  private parseImports(content: string, currentPath: string): string[] {
    const imports: string[] = [];

    // 匹配 import 语句 (支持多种格式)
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"](.+?)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];

      // 只处理相对导入和 @ 别名导入
      if (importPath.startsWith('./') ||
          importPath.startsWith('../') ||
          importPath.startsWith('@/')) {

        const resolvedPath = this.resolveImportPath(importPath, currentPath);
        if (resolvedPath) {
          imports.push(resolvedPath);
        }
      }
    }

    return imports;
  }

  /**
   * 解析导入路径
   */
  private resolveImportPath(importPath: string, currentPath: string): string | null {
    try {
      let resolvedPath: string;

      if (importPath.startsWith('@/')) {
        // @ 别名指向 src/
        resolvedPath = importPath.substring(2);
      } else {
        // 相对路径
        const currentDir = path.dirname(currentPath);
        resolvedPath = path.normalize(path.join(currentDir, importPath));
      }

      // 尝试添加可能的扩展名
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];

      for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        if (this.files.has(fullPath)) {
          return fullPath;
        }
      }

      // 尝试 index 文件
      for (const ext of extensions) {
        const indexPath = path.join(resolvedPath, 'index' + ext);
        if (this.files.has(indexPath)) {
          return indexPath;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 构建反向依赖关系 (被谁导入)
   */
  private buildExportedByRelations(): void {
    for (const file of this.files.values()) {
      for (const importPath of file.imports) {
        const importedFile = this.files.get(importPath);
        if (importedFile) {
          importedFile.exportedBy.push(file.id);
        }
      }
    }
  }

  /**
   * 计算所有文件的重要性
   */
  private calculateAllImportance(): void {
    const allFiles = Array.from(this.files.values());

    for (const file of allFiles) {
      file.importance = this.calculateImportance(file, allFiles);
    }
  }

  /**
   * 计算文件重要性
   *
   * 公式: importance = (依赖计数 × 0.5) + (代码量 × 0.2) + (类型权重 × 0.3)
   */
  private calculateImportance(file: ProjectFile, allFiles: ProjectFile[]): number {
    // 1. 依赖计数分数 (被多少文件导入)
    const maxDependencies = Math.max(...allFiles.map(f => f.exportedBy.length), 1);
    const dependencyScore = file.exportedBy.length / maxDependencies;

    // 2. 代码量分数
    const maxLines = Math.max(...allFiles.map(f => f.lines), 1);
    const sizeScore = Math.min(file.lines / maxLines, 1.0);

    // 3. 类型权重
    const typeWeight = this.getTypeWeight(file.type);

    // 计算总分
    const importance = (
      dependencyScore * 0.5 +
      sizeScore * 0.2 +
      typeWeight * 0.3
    );

    return Math.min(importance, 1.0);
  }

  /**
   * 获取文件类型的权重
   */
  private getTypeWeight(type: NodeType): number {
    const weights: Record<string, number> = {
      'store': 1.0,          // 状态管理最重要
      'service': 0.9,        // 服务层次之
      'page': 0.8,           // 页面重要
      'api-route': 0.8,      // API 路由重要
      'component-scene': 0.7, // 场景组件
      'component-ui': 0.6,   // UI 组件
      'util': 0.5,           // 工具函数
      'type-def': 0.4,       // 类型定义
      'document': 0.3        // 普通文档
    };

    return weights[type] || 0.3;
  }

  /**
   * 生成文件描述
   */
  private generateDescription(type: NodeType, relativePath: string): string {
    const typeDescriptions: Record<string, string> = {
      'page': 'Next.js 页面',
      'api-route': 'API 路由',
      'component-scene': '3D 场景组件',
      'component-ui': 'UI 组件',
      'service': '服务层',
      'store': '状态管理',
      'util': '工具函数',
      'type-def': '类型定义'
    };

    const baseDesc = typeDescriptions[type] || '项目文件';
    return `${baseDesc} - ${relativePath}`;
  }

  /**
   * 判断是否应该跳过该路径
   */
  private shouldSkip(relativePath: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.next',
      '.git',
      'dist',
      'build',
      'out',
      'coverage',
      '__tests__',
      '.test.',
      '.spec.'
    ];

    return skipPatterns.some(pattern => relativePath.includes(pattern));
  }

  /**
   * 获取所有文件
   */
  getFiles(): ProjectFile[] {
    return Array.from(this.files.values());
  }

  /**
   * 获取依赖关系 (用于连接线)
   */
  getDependencies(): [string, string][] {
    const dependencies: [string, string][] = [];

    for (const file of this.files.values()) {
      for (const importPath of file.imports) {
        dependencies.push([file.id, importPath]);
      }
    }

    return dependencies;
  }

  /**
   * 按重要性排序文件
   */
  getFilesSortedByImportance(): ProjectFile[] {
    return this.getFiles().sort((a, b) => b.importance - a.importance);
  }

  /**
   * 按类型分组文件
   */
  getFilesByType(): Map<NodeType, ProjectFile[]> {
    const grouped = new Map<NodeType, ProjectFile[]>();

    for (const file of this.files.values()) {
      const existing = grouped.get(file.type) || [];
      existing.push(file);
      grouped.set(file.type, existing);
    }

    return grouped;
  }
}

// 导出单例
export const projectStructureService = new ProjectStructureService();
