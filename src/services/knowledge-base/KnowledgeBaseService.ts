import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { KnowledgeNode, Connection, NodeType, ShapeType } from '@/types/knowledge';

export class KnowledgeBaseService {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private connections: Connection[] = [];
  private rootPath: string = '';

  async initialize(rootPath: string): Promise<void> {
    this.rootPath = rootPath;
    await this.loadKnowledgeBase();
  }

  private async loadKnowledgeBase(): Promise<void> {
    if (!window.electron) {
      return;
    }

    try {
      const files = await this.scanDirectory(this.rootPath);
      const markdownFiles = files.filter((f) => f.endsWith('.md'));

      // 并行加载所有文件
      const loadPromises = markdownFiles.map((file) => this.loadMarkdownFile(file));
      await Promise.all(loadPromises);

      // 构建连接关系
      this.buildConnections();

    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  }

  private async scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    if (!window.electron) {
      return files;
    }

    try {
      const entries = await window.electron.fs.readDirectory(dirPath);

      for (const entry of entries) {
        if (entry.isDirectory) {
          // 递归扫描子目录（排除 node_modules, .git 等）
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            const subFiles = await this.scanDirectory(entry.path);
            files.push(...subFiles);
          }
        } else if (entry.name.endsWith('.md')) {
          files.push(entry.path);
        }
      }
    } catch (error) {
      console.error(`Failed to scan directory ${dirPath}:`, error);
    }

    return files;
  }

  private async loadMarkdownFile(filePath: string): Promise<void> {
    if (!window.electron) {
      return;
    }

    try {
      const content = await window.electron.fs.readFile(filePath);
      const { data: frontmatter, content: markdown } = matter(content);

      // 提取链接
      const links = this.extractLinks(markdown);

      // 提取标签
      const tags = this.extractTags(markdown, frontmatter);

      // 确定节点类型
      const type = this.determineNodeType(filePath, frontmatter, markdown);

      // 获取文件统计信息
      const stats = await this.getFileStats(filePath);

      // 创建节点
      const node: KnowledgeNode = {
        id: this.generateNodeId(filePath),
        type,
        title: frontmatter.title || this.extractTitle(markdown, filePath),
        description: frontmatter.description || this.extractDescription(markdown),
        filePath,
        content: markdown,
        tags,
        links,
        position: [0, 0, 0], // 将由布局算法设置
        metadata: {
          size: content.length,
          created: stats.created || new Date(),
          modified: stats.modified || new Date(),
          accessed: new Date(),
          accessCount: 0,
          importance: this.calculateImportance(markdown, links.length),
        },
        visual: this.getVisualConfig(type),
      };

      this.nodes.set(node.id, node);
    } catch (error) {
      console.error(`Failed to load file ${filePath}:`, error);
    }
  }

  private extractLinks(markdown: string): string[] {
    const links: string[] = [];

    // Markdown 链接格式: [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = markdownLinkRegex.exec(markdown)) !== null) {
      links.push(match[2]);
    }

    // Wiki 链接格式: [[link]]
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    while ((match = wikiLinkRegex.exec(markdown)) !== null) {
      links.push(match[1]);
    }

    return Array.from(new Set(links)); // 去重
  }

  private extractTags(markdown: string, frontmatter: any): string[] {
    const tags: string[] = [];

    // 从 frontmatter 中提取标签
    if (frontmatter.tags) {
      if (Array.isArray(frontmatter.tags)) {
        tags.push(...frontmatter.tags);
      } else if (typeof frontmatter.tags === 'string') {
        tags.push(...frontmatter.tags.split(',').map((t: string) => t.trim()));
      }
    }

    // 从正文中提取 hashtag
    const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
    let match;
    while ((match = hashtagRegex.exec(markdown)) !== null) {
      tags.push(match[1]);
    }

    return Array.from(new Set(tags)); // 去重
  }

  private determineNodeType(filePath: string, frontmatter: any, markdown: string): NodeType {
    // 优先使用 frontmatter 中的类型
    if (frontmatter.type) {
      return frontmatter.type as NodeType;
    }

    // 根据文件路径判断
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.includes('error') || lowerPath.includes('E0')) return 'error';
    if (lowerPath.includes('mcp')) return 'mcp';
    if (lowerPath.includes('skill')) return 'skill';
    if (lowerPath.includes('plugin')) return 'plugin';
    if (lowerPath.includes('config')) return 'config';

    // 根据文件名判断
    const fileName = filePath.split(/[\\/]/).pop() || '';
    if (fileName === 'CLAUDE.md') return 'document';
    if (fileName === 'README.md') return 'category';
    if (fileName === 'INDEX.md') return 'category';

    // 默认为 document
    return 'document';
  }

  private extractTitle(markdown: string, filePath: string): string {
    // 尝试从第一个 # 标题提取
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) return titleMatch[1];

    // 使用文件名
    const fileName = filePath.split(/[\\/]/).pop() || '';
    return fileName.replace('.md', '');
  }

  private extractDescription(markdown: string): string {
    // 提取第一段文字（不包括标题）
    const lines = markdown.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
        return trimmed.slice(0, 200); // 最多 200 字符
      }
    }
    return '';
  }

  private calculateImportance(markdown: string, linkCount: number): number {
    // 基于多个因素计算重要性（0-1）
    let importance = 0;

    // 文件长度权重（归一化到 0.3）
    const lengthScore = Math.min(markdown.length / 10000, 1) * 0.3;
    importance += lengthScore;

    // 链接数量权重（归一化到 0.4）
    const linkScore = Math.min(linkCount / 20, 1) * 0.4;
    importance += linkScore;

    // 标题层级权重（0.3）
    const headingCount = (markdown.match(/^#+\s/gm) || []).length;
    const headingScore = Math.min(headingCount / 10, 1) * 0.3;
    importance += headingScore;

    return Math.min(importance, 1);
  }

  private getVisualConfig(type: NodeType): KnowledgeNode['visual'] {
    const configs: Record<NodeType, { color: string; shape: ShapeType; glow: boolean; icon: string }> = {
      // Claude 核心类型
      claude: { color: '#0066FF', shape: 'sphere', glow: true, icon: 'brain' },
      adapter: { color: '#00FFFF', shape: 'octahedron', glow: true, icon: 'link' },
      // Claude配置类型
      document: { color: '#3B82F6', shape: 'sphere', glow: true, icon: 'file' },
      category: { color: '#8B5CF6', shape: 'cube', glow: false, icon: 'folder' },
      error: { color: '#EF4444', shape: 'octahedron', glow: true, icon: 'alert' },
      mcp: { color: '#06B6D4', shape: 'cylinder', glow: false, icon: 'server' },
      skill: { color: '#10B981', shape: 'torus', glow: true, icon: 'zap' },
      plugin: { color: '#F59E0B', shape: 'dodecahedron', glow: false, icon: 'puzzle' },
      config: { color: '#6B7280', shape: 'cube', glow: false, icon: 'settings' },
      // 工程化组件类型
      hook: { color: '#EF4444', shape: 'cone', glow: true, icon: 'anchor' },
      rule: { color: '#8B5CF6', shape: 'box', glow: false, icon: 'file-text' },
      agent: { color: '#EC4899', shape: 'icosahedron', glow: true, icon: 'users' },
      memory: { color: '#14B8A6', shape: 'sphere', glow: false, icon: 'database' },
      // 项目结构类型
      page: { color: '#2196F3', shape: 'sphere', glow: false, icon: 'file' },
      'api-route': { color: '#4CAF50', shape: 'sphere', glow: false, icon: 'server' },
      'component-scene': { color: '#9C27B0', shape: 'sphere', glow: false, icon: 'box' },
      'component-ui': { color: '#E91E63', shape: 'sphere', glow: false, icon: 'layout' },
      service: { color: '#FF9800', shape: 'sphere', glow: false, icon: 'cog' },
      store: { color: '#F44336', shape: 'sphere', glow: false, icon: 'database' },
      util: { color: '#FFEB3B', shape: 'sphere', glow: false, icon: 'wrench' },
      'type-def': { color: '#607D8B', shape: 'sphere', glow: false, icon: 'code' },
      folder: { color: '#BDBDBD', shape: 'cube', glow: false, icon: 'folder' },
    };

    const config = configs[type] || configs.document;
    return {
      ...config,
      size: 1.0,
    };
  }

  private async getFileStats(filePath: string): Promise<{ created: Date; modified: Date }> {
    // 在实际实现中，应该从文件系统获取
    return {
      created: new Date(),
      modified: new Date(),
    };
  }

  private generateNodeId(filePath: string): string {
    // 使用相对路径作为 ID
    return filePath.replace(/\\/g, '/').replace(this.rootPath, '');
  }

  private buildConnections(): void {
    this.connections = [];

    // 遍历所有节点，为每个链接创建连接
    for (const [sourceId, sourceNode] of this.nodes) {
      for (const link of sourceNode.links) {
        // 尝试找到目标节点
        const targetNode = this.findNodeByLink(link);
        if (targetNode) {
          const connection: Connection = {
            id: `${sourceId}-${targetNode.id}`,
            source: sourceId,
            target: targetNode.id,
            type: 'reference',
            strength: 0.8,
            metadata: {
              created: new Date(),
              manual: false,
            },
            visual: {
              color: '#FFFFFF',
              width: 2,
              dashed: false,
              animated: true,
            },
          };
          this.connections.push(connection);
        }
      }
    }
  }

  private findNodeByLink(link: string): KnowledgeNode | undefined {
    // 规范化链接格式
    const normalizedLink = link.replace(/\\/g, '/').toLowerCase();

    // 尝试直接匹配
    for (const [id, node] of this.nodes) {
      if (id.toLowerCase().includes(normalizedLink) ||
          normalizedLink.includes(id.toLowerCase())) {
        return node;
      }
    }

    // 尝试匹配文件名
    const fileName = link.split('/').pop();
    if (fileName) {
      for (const [_, node] of this.nodes) {
        const nodeFileName = node.filePath.split(/[\\/]/).pop();
        if (nodeFileName === fileName) {
          return node;
        }
      }
    }

    return undefined;
  }

  getNodes(): KnowledgeNode[] {
    return Array.from(this.nodes.values());
  }

  getConnections(): Connection[] {
    return this.connections;
  }

  getNodeById(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  async watchDirectory(dirPath: string, callback: () => void): Promise<void> {
    if (!window.electron) return;

    window.electron.fs.onFileChanged((data: any) => {
      // 重新加载知识库
      this.loadKnowledgeBase().then(callback);
    });

    await window.electron.fs.watchDirectory(dirPath);
  }
}

// 单例实例
export const knowledgeBaseService = new KnowledgeBaseService();
