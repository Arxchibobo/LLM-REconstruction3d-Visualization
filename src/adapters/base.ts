/**
 * Data Source Adapter - Base Interface
 *
 * 借鉴 Ophel 的适配器模式，统一不同数据源的接口
 * 每个数据源（Claude Config、Project Structure、Markdown 等）
 * 只需实现此接口即可接入系统
 */

import { KnowledgeNode, Connection, KnowledgeGraph } from '@/types/knowledge';

export interface DataSourceAdapter {
  /**
   * 适配器名称（唯一标识）
   */
  readonly name: string;

  /**
   * 适配器显示名称
   */
  readonly displayName: string;

  /**
   * 适配器描述
   */
  readonly description: string;

  /**
   * 支持的数据源类型
   */
  readonly sourceType: 'api' | 'file' | 'memory';

  /**
   * 获取完整的知识图谱数据
   * @returns 包含节点和连接的图谱数据
   */
  fetchData(): Promise<KnowledgeGraph>;

  /**
   * 解析原始数据为节点
   * @param raw 原始数据对象
   * @returns 标准化的知识节点
   */
  parseNode(raw: any): KnowledgeNode;

  /**
   * 解析原始数据为连接
   * @param raw 原始连接数据
   * @returns 标准化的连接对象
   */
  parseConnection(raw: any): Connection;

  /**
   * 验证数据有效性
   * @param data 待验证的数据
   * @returns 是否有效
   */
  validateData(data: any): boolean;

  /**
   * 获取数据统计信息
   * @returns 节点数量、连接数量等统计
   */
  getStatistics?(): Promise<{
    nodeCount: number;
    connectionCount: number;
    categories: string[];
    lastUpdated?: Date;
  }>;

  /**
   * 刷新数据（可选）
   * @returns 是否成功刷新
   */
  refresh?(): Promise<boolean>;
}

/**
 * 适配器配置
 */
export interface AdapterConfig {
  /**
   * API 端点（如果是 API 类型）
   */
  apiEndpoint?: string;

  /**
   * 文件路径（如果是 file 类型）
   */
  filePath?: string;

  /**
   * 缓存策略
   */
  cache?: {
    enabled: boolean;
    ttl: number; // 缓存时间（毫秒）
  };

  /**
   * 自定义配置
   */
  custom?: Record<string, any>;
}

/**
 * 适配器基类（提供通用功能）
 */
export abstract class BaseAdapter implements DataSourceAdapter {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly sourceType: 'api' | 'file' | 'memory';

  protected config: AdapterConfig;
  protected cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: AdapterConfig = {}) {
    this.config = {
      cache: {
        enabled: true,
        ttl: 5 * 60 * 1000 // 默认 5 分钟
      },
      ...config
    };
  }

  abstract fetchData(): Promise<KnowledgeGraph>;
  abstract parseNode(raw: any): KnowledgeNode;
  abstract parseConnection(raw: any): Connection;

  /**
   * 默认验证：检查基本字段是否存在
   */
  validateData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.nodes) &&
      Array.isArray(data.connections)
    );
  }

  /**
   * 缓存辅助方法
   */
  protected getCachedData<T>(key: string): T | null {
    if (!this.config.cache?.enabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const ttl = this.config.cache.ttl || 0;

    if (now - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  protected setCachedData(key: string, data: any): void {
    if (!this.config.cache?.enabled) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  protected clearCache(): void {
    this.cache.clear();
  }

  /**
   * 统一错误处理
   */
  protected handleError(error: any, context: string): never {
    console.error(`[${this.name}] Error in ${context}:`, error);
    throw new Error(`Adapter ${this.name} failed: ${error.message}`);
  }
}

/**
 * 适配器工厂（用于动态创建适配器）
 */
export type AdapterFactory = (config?: AdapterConfig) => DataSourceAdapter;

/**
 * 适配器注册表
 */
export class AdapterRegistry {
  private adapters: Map<string, AdapterFactory> = new Map();

  /**
   * 注册适配器工厂
   */
  register(name: string, factory: AdapterFactory): void {
    if (this.adapters.has(name)) {
    }
    this.adapters.set(name, factory);
  }

  /**
   * 获取适配器实例
   */
  get(name: string, config?: AdapterConfig): DataSourceAdapter {
    const factory = this.adapters.get(name);
    if (!factory) {
      throw new Error(`Adapter ${name} not found`);
    }
    return factory(config);
  }

  /**
   * 获取所有已注册的适配器名称
   */
  list(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * 检查适配器是否已注册
   */
  has(name: string): boolean {
    return this.adapters.has(name);
  }
}

/**
 * 全局适配器注册表实例
 */
export const adapterRegistry = new AdapterRegistry();
