/**
 * Project Structure Adapter
 *
 * 解析项目文件结构并转换为知识图谱
 * 可视化文件依赖关系和目录层次
 */

import { BaseAdapter, AdapterConfig } from './base';
import { KnowledgeNode, Connection, KnowledgeGraph, NodeType } from '@/types/knowledge';

/**
 * 文件节点原始数据
 */
interface ProjectFile {
  path: string;
  name: string;
  type: 'file' | 'folder';
  category?: string;
  imports?: string[];
}

/**
 * 项目结构原始响应
 */
interface ProjectStructureResponse {
  files: ProjectFile[];
  rootPath: string;
}

export class ProjectStructureAdapter extends BaseAdapter {
  readonly name = 'project-structure';
  readonly displayName = 'Project Structure';
  readonly description = 'Visualize project files and dependencies';
  readonly sourceType = 'api' as const;

  constructor(config?: AdapterConfig) {
    super({
      apiEndpoint: '/api/project-structure',
      ...config
    });
  }

  async fetchData(): Promise<KnowledgeGraph> {
    const cacheKey = 'project-structure-data';
    const cached = this.getCachedData<KnowledgeGraph>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(this.config.apiEndpoint!);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData: ProjectStructureResponse = await response.json();

      if (!this.validateData(rawData)) {
        throw new Error('Invalid project structure data');
      }

      const graphData = this.transformToGraph(rawData);
      this.setCachedData(cacheKey, graphData);

      return graphData;
    } catch (error) {
      this.handleError(error, 'fetchData');
    }
  }

  /**
   * 将项目结构转换为知识图谱
   */
  private transformToGraph(data: ProjectStructureResponse): KnowledgeGraph {
    const nodes: KnowledgeNode[] = [];
    const connections: Connection[] = [];

    // 创建文件/文件夹节点
    data.files.forEach(file => {
      const node = this.parseNode(file);
      nodes.push(node);

      // 创建父子关系连接
      const parentPath = this.getParentPath(file.path);
      if (parentPath && parentPath !== data.rootPath) {
        connections.push(this.parseConnection({
          source: this.getNodeId(file.path),
          target: this.getNodeId(parentPath),
          type: 'contains',
          strength: 0.8,
        }));
      }

      // 创建导入依赖连接
      if (file.imports && file.imports.length > 0) {
        file.imports.forEach(importPath => {
          connections.push(this.parseConnection({
            source: this.getNodeId(file.path),
            target: this.getNodeId(importPath),
            type: 'import',
            strength: 0.6,
          }));
        });
      }
    });

    return {
      nodes,
      connections,
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        totalSize: nodes.length + connections.length,
        fileCount: nodes.length,
      },
    };
  }

  parseNode(raw: any): KnowledgeNode {
    const file = raw as ProjectFile;
    const nodeType = this.getNodeType(file);

    return {
      id: this.getNodeId(file.path),
      type: nodeType,
      title: file.name,
      description: file.path,
      filePath: file.path,
      content: '',
      tags: [file.category || this.inferCategory(file.path)],
      links: file.imports || [],
      position: [0, 0, 0],
      tier: file.type === 'folder' ? 'CoreSkill' : 'Item',
      orbit: 3,
      metadata: {
        size: 1,
        created: new Date(),
        modified: new Date(),
        accessed: new Date(),
        accessCount: 0,
        importance: 0.5,
      },
      visual: {
        color: '#FFFFFF',
        size: file.type === 'folder' ? 1.0 : 0.6,
        shape: file.type === 'folder' ? 'cube' : 'sphere',
        glow: false,
        icon: file.type === 'folder' ? '📁' : '📄',
      },
    };
  }

  parseConnection(raw: any): Connection {
    return {
      id: `${raw.source}->${raw.target}`,
      source: raw.source,
      target: raw.target,
      type: raw.type || 'related',
      strength: raw.strength || 0.5,
      label: raw.label,
      metadata: {
        created: new Date(),
        manual: false,
      },
      visual: {
        color: '#808080',
        width: 1,
        dashed: false,
        animated: false,
      },
    };
  }

  validateData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.files) &&
      typeof data.rootPath === 'string'
    );
  }

  /**
   * 辅助方法：获取节点类型
   */
  private getNodeType(file: ProjectFile): NodeType {
    if (file.type === 'folder') return 'folder';

    const path = file.path.toLowerCase();

    if (path.includes('/pages/') || path.includes('/app/') && path.endsWith('page.tsx')) {
      return 'page';
    }
    if (path.includes('/api/')) {
      return 'api-route';
    }
    if (path.includes('/components/scene/')) {
      return 'component-scene';
    }
    if (path.includes('/components/')) {
      return 'component-ui';
    }
    if (path.includes('/services/')) {
      return 'service';
    }
    if (path.includes('/stores/')) {
      return 'store';
    }
    if (path.includes('/utils/')) {
      return 'util';
    }
    if (path.includes('/types/') || path.endsWith('.d.ts')) {
      return 'type-def';
    }

    return 'document';
  }

  /**
   * 辅助方法：推断文件分类
   */
  private inferCategory(path: string): string {
    const segments = path.split('/');

    if (segments.includes('components')) return 'Components';
    if (segments.includes('pages') || segments.includes('app')) return 'Pages';
    if (segments.includes('api')) return 'API';
    if (segments.includes('services')) return 'Services';
    if (segments.includes('stores')) return 'State';
    if (segments.includes('utils')) return 'Utils';
    if (segments.includes('types')) return 'Types';

    return 'Other';
  }

  /**
   * 辅助方法：获取节点 ID
   */
  private getNodeId(path: string): string {
    return `file-${path.replace(/\//g, '-')}`;
  }

  /**
   * 辅助方法：获取父路径
   */
  private getParentPath(path: string): string | null {
    const segments = path.split('/');
    if (segments.length <= 1) return null;
    return segments.slice(0, -1).join('/');
  }

  /**
   * 辅助方法：获取文件扩展名
   */
  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  async getStatistics() {
    try {
      const data = await this.fetchData();
      const fileTypes = new Set(
        data.nodes
          .filter(n => n.type !== 'folder')
          .map(n => this.getExtension(n.title))
          .filter(Boolean)
      );

      return {
        nodeCount: data.nodes.length,
        connectionCount: data.connections.length,
        categories: Array.from(fileTypes) as string[],
        lastUpdated: new Date()
      };
    } catch (error) {
      this.handleError(error, 'getStatistics');
    }
  }

  async refresh(): Promise<boolean> {
    try {
      this.clearCache();
      await this.fetchData();
      return true;
    } catch (error) {
      console.error('[ProjectStructureAdapter] Refresh failed:', error);
      return false;
    }
  }
}
