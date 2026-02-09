'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { QuadraticBezierLine, Line } from '@react-three/drei';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import {
  computeRadialLayout,
  computeSphereLayout,
  computeSpiralLayout,
  computeHierarchicalLayout,
  computeOrbitalLayout,
} from '@/utils/layout';
import * as THREE from 'three';
import type { KnowledgeNode, Connection } from '@/types/knowledge';
import PlanetNode from './PlanetNode';
import InstancedPlanetNodes from './InstancedPlanetNodes';
import CenterRobot from './CenterRobot';
import GridFloor from './GridFloor';
import ParticleField from './ParticleField';
import HooksLayerDetail from './HooksLayerDetail';

/**
 * Build arc points for dashed line rendering
 */
function buildArcPoints(
  start: Vector3,
  end: Vector3,
  arcHeight: number,
  sideOffset: number = 0,
  segments: number = 32
): Vector3[] {
  const mid = new Vector3().lerpVectors(start, end, 0.5);
  mid.y += arcHeight;
  mid.x += sideOffset;
  mid.z += sideOffset * 0.3;

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return curve.getPoints(segments);
}

/**
 * 根据形状计算表面乘数
 */
function getShapeMultiplier(shape: string | undefined): number {
  switch(shape) {
    case 'sphere': return 1.0;
    case 'cube':
    case 'box': return 1.2;
    case 'cylinder': return 1.1;
    case 'cone': return 1.3;
    case 'octahedron': return 1.15;
    case 'dodecahedron': return 1.1;
    case 'icosahedron': return 1.1;
    case 'torus': return 1.4;
    default: return 1.0;
  }
}

/**
 * 计算连接线的弧度和侧向偏移
 * 根据连接索引和组大小计算更分散的偏移
 */
function calculateCurveOffset(
  conn: Connection,
  index: number,
  totalConnections: number,
  distance: number,
  isCoreConnection: boolean,
  isResourceConnection: boolean
): { arcHeight: number; sideOffset: number } {
  if (isCoreConnection) {
    // 骨架连接：优雅的向上拱形
    return {
      arcHeight: Math.min(distance * 0.4, 6),
      sideOffset: 0
    };
  }

  if (isResourceConnection) {
    // 资源连接：根据索引分散侧向偏移
    const spreadFactor = totalConnections > 1
      ? ((index % 10) / Math.max(9, 1)) - 0.5
      : 0;
    const sideOffset = spreadFactor * 4; // 更大的分散范围

    // 交替高度避免重叠
    const heightVariation = ((index % 3) - 1) * 1.5;
    const arcHeight = Math.min(distance * 0.15, 3) + heightVariation;

    return { arcHeight, sideOffset };
  }

  // 默认
  return {
    arcHeight: Math.min(distance * 0.25, 4),
    sideOffset: 0
  };
}
export default function KnowledgeGraph() {
  const groupRef = useRef<Group>(null);
  const {
    nodes,
    connections,
    searchQuery,
    searchNodes,
    layoutType,
    hoveredNode,
    selectedNode,
    enabledNodeTypes,
    setLayoutNodeMap
  } = useKnowledgeStore();

  // 搜索和类型过滤节点
  const filteredNodes = useMemo(() => {
    // 先按搜索查询过滤
    let result = searchQuery.trim() ? searchNodes(searchQuery) : nodes;

    // 再按节点类型过滤
    result = result.filter(node => enabledNodeTypes.has(node.type));

    return result;
  }, [nodes, searchQuery, searchNodes, enabledNodeTypes]);

  // 使用布局算法计算节点位置和工程化连接
  const layout = useMemo(() => {
    if (filteredNodes.length === 0) return { nodes: [], nodeMap: {}, connections: [] };

    let result;
    switch (layoutType) {
      case 'orbital':
        result = computeOrbitalLayout(filteredNodes, connections);
        break;
      case 'force':
        result = { ...computeRadialLayout(filteredNodes, 15, 3), connections };
        break;
      case 'circular':
        result = { ...computeSphereLayout(filteredNodes, 20), connections };
        break;
      case 'grid':
        result = { ...computeSpiralLayout(filteredNodes, 3), connections };
        break;
      case 'hierarchical':
        result = { ...computeHierarchicalLayout(filteredNodes, connections, 10, 5), connections };
        break;
      default:
        result = computeOrbitalLayout(filteredNodes, connections);
    }

    return result;
  }, [filteredNodes, connections, layoutType]);

  // 同步布局计算位置到 store，供 AttentionFlow 等组件使用
  // 写入单独的 layoutNodeMap 字段，不会触发 layout 重算，无循环风险
  useEffect(() => {
    if (layout.nodeMap && Object.keys(layout.nodeMap).length > 0) {
      setLayoutNodeMap(layout.nodeMap);
    }
  }, [layout.nodeMap, setLayoutNodeMap]);

  // 🔄 禁用自动旋转动画 - 保持节点和连接线对齐
  // useFrame((state) => {
  //   if (groupRef.current) {
  //     groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.3;
  //   }
  // });

  // 当搜索结果为空时显示消息
  if (filteredNodes.length === 0) {
    return null;
  }

  // 过滤掉中心节点（已由CenterRobot独立渲染）
  const planetsToRender = layout.nodes.filter((node) => node.id !== 'center');

  // Split nodes: core/tool/hovered/selected/connected → full PlanetNode, rest → instanced
  const { fullRenderNodes, instancedNodes } = useMemo(() => {
    const fullIds = new Set<string>();

    // Always render core (adapter) and tool (category) layer nodes as full PlanetNodes
    const coreToolTypes = new Set(['adapter', 'category']);
    planetsToRender.forEach(node => {
      if (coreToolTypes.has(node.type)) {
        fullIds.add(node.id);
      }
    });

    // Always render hovered, selected, and connected nodes as full
    if (hoveredNode) fullIds.add(hoveredNode.id);
    if (selectedNode) {
      fullIds.add(selectedNode.id);
      connections.forEach(conn => {
        if (conn.source === selectedNode.id) fullIds.add(conn.target);
        if (conn.target === selectedNode.id) fullIds.add(conn.source);
      });
    }

    const full: KnowledgeNode[] = [];
    const instanced: KnowledgeNode[] = [];

    planetsToRender.forEach(node => {
      if (fullIds.has(node.id)) {
        full.push(node);
      } else {
        instanced.push(node);
      }
    });

    return { fullRenderNodes: full, instancedNodes: instanced };
  }, [planetsToRender, hoveredNode, selectedNode, connections]);

  /**
   * 🔗 优雅的连接线系统 - 分层渐进显示
   *
   * 层级结构：
   * - 第0层: center (CenterRobot at [0,0,0])
   * - 第1层: layer-hooks (核心路由层)
   * - 第2层: category-xxx (7个分类节点)
   * - 第3层: 具体资源 (skill, mcp, plugin, hook, rule, agent, memory)
   *
   * 显示规则：
   * - 默认: 只显示 layer-hooks → categories 的骨架线
   * - Hover category: 显示该 category 到子节点的连接
   * - Hover 资源节点: 高亮显示该节点到父 category 的路径
   * - 选中节点: 显示完整调用路径
   */
  const visibleConnections = useMemo(() => {
    const allConnections = layout.connections && layout.connections.length > 0
      ? layout.connections
      : connections;

    // 使用 Map 去重连接
    const uniqueConnections = new Map<string, typeof allConnections[0]>();

    // 🎯 核心骨架：center → categories（由 AttentionFlow 处理动画流）
    const skeletonConnections = allConnections.filter((conn) => {
      // center 到各 category 的路由连接
      if (conn.source === 'center' && conn.target.startsWith('category-')) return true;
      return false;
    });

    // 先添加骨架连接
    skeletonConnections.forEach(conn => {
      uniqueConnections.set(conn.id, conn);
    });

    // 🖱️ Hover category 时：显示该 category 下的所有子连接
    if (hoveredNode?.type === 'category') {
      const categoryConnections = allConnections.filter((conn) => {
        return conn.source === hoveredNode.id;
      });
      categoryConnections.forEach(conn => {
        uniqueConnections.set(conn.id, conn);
      });
      return Array.from(uniqueConnections.values());
    }

    // 🖱️ Hover 资源节点时：高亮显示到父 category 的路径
    if (hoveredNode) {
      const nodeType = hoveredNode.type;
      const categoryMap: Record<string, string> = {
        skill: 'category-skills',
        mcp: 'category-mcp',
        plugin: 'category-plugins',
        rule: 'category-rules',
        agent: 'category-agents',
        memory: 'category-memory',
        hook: 'category-hooks',
      };
      const categoryId = categoryMap[nodeType];

      if (categoryId) {
        // 找到 hovered 节点的直接连接
        const directConnection = allConnections.filter((conn) => {
          return conn.target === hoveredNode.id && conn.source === categoryId;
        });
        directConnection.forEach(conn => {
          uniqueConnections.set(conn.id, conn);
        });
        return Array.from(uniqueConnections.values());
      }
    }

    // 🎯 选中节点时：显示完整调用路径（包括到 center 的连接）
    if (selectedNode) {
      const selectedConnections = allConnections.filter((conn) => {
        return conn.source === selectedNode.id || conn.target === selectedNode.id;
      });
      selectedConnections.forEach(conn => {
        uniqueConnections.set(conn.id, conn);
      });

      // 如果选中的是 category，也显示 center → category 的完整路径
      if (selectedNode.type === 'category') {
        const corePathConnections = allConnections.filter((conn) => {
          if (conn.source === 'center' && conn.target === selectedNode.id) return true;
          return false;
        });
        corePathConnections.forEach(conn => {
          uniqueConnections.set(conn.id, conn);
        });
      }

      return Array.from(uniqueConnections.values());
    }

    return Array.from(uniqueConnections.values());
  }, [hoveredNode, selectedNode, connections, layout.connections]);

  return (
    <>
      {/* 🌌 背景增强效果 */}
      <ParticleField />
      <GridFloor />
      <HooksLayerDetail layoutPosition={layout.nodeMap['category-hooks']?.position} />

      {/* 中心机器人 */}
      <CenterRobot />

      {/* 🔗 优雅的连接线系统 */}
      {visibleConnections.map((conn, index) => {
        const source = layout.nodeMap[conn.source];
        const target = layout.nodeMap[conn.target];

        // 如果源节点或目标节点不存在，跳过
        if (!source || !target) {
          // 特殊处理 center 节点（固定位置）
          if (conn.source === 'center' || conn.target === 'center') {
            const centerPos: [number, number, number] = [0, 0, 0];
            const otherNode = conn.source === 'center' ? target : source;
            if (!otherNode) return null;

            const centerVec = new Vector3(...centerPos);
            const otherVec = new Vector3(...otherNode.position);

            // 🎯 计算几何体表面端点
            const direction = new Vector3().subVectors(otherVec, centerVec).normalize();
            const centerSize = 2.5; // CenterRobot 的大小
            const otherSize = otherNode.visual?.size || 1.0;

            const start = conn.source === 'center'
              ? centerVec.clone().add(direction.clone().multiplyScalar(centerSize))
              : otherVec.clone().sub(direction.clone().multiplyScalar(otherSize * 1.2));
            const end = conn.target === 'center'
              ? centerVec.clone().sub(direction.clone().multiplyScalar(centerSize))
              : otherVec.clone().add(direction.clone().multiplyScalar(otherSize * 1.2));

            return (
              <QuadraticBezierLine
                key={`conn-${conn.id}-${index}`}
                start={start}
                end={end}
                mid={new Vector3(
                  (start.x + end.x) / 2,
                  (start.y + end.y) / 2 + 3,
                  (start.z + end.z) / 2
                )}
                color={conn.visual?.color || '#00FFFF'}
                lineWidth={1}
                transparent
                opacity={0.4}
              />
            );
          }
          return null;
        }

        // 获取实际的渲染位置
        const startPos = source.position;
        const endPos = target.position;
        const startCenter = new Vector3(...startPos);
        const endCenter = new Vector3(...endPos);

        // 🎯 计算几何体表面端点（而不是中心点）
        // 根据节点尺寸和形状，沿连接方向偏移到表面
        const direction = new Vector3().subVectors(endCenter, startCenter).normalize();
        const sourceSize = source.visual?.size || 1.0;
        const targetSize = target.visual?.size || 1.0;

        // 根据形状获取表面乘数
        const sourceMultiplier = getShapeMultiplier(source.visual?.shape) * sourceSize;
        const targetMultiplier = getShapeMultiplier(target.visual?.shape) * targetSize;

        // 起点从源节点表面出发
        const start = startCenter.clone().add(direction.clone().multiplyScalar(sourceMultiplier * 1.2));
        // 终点到达目标节点表面
        const end = endCenter.clone().sub(direction.clone().multiplyScalar(targetMultiplier * 1.2));

        // 计算距离和优雅的弧度
        const distance = start.distanceTo(end);

        // 🎨 根据连接层级计算弧度
        const isCoreConnection = conn.source === 'center';
        const isResourceConnection = conn.source.startsWith('category-');

        // 使用辅助函数计算弧度和偏移
        const { arcHeight, sideOffset } = calculateCurveOffset(
          conn,
          index,
          visibleConnections.length,
          distance,
          isCoreConnection,
          isResourceConnection
        );

        const midPoint = new Vector3().addVectors(start, end).multiplyScalar(0.5);
        const controlPoint = new Vector3(
          midPoint.x + sideOffset,
          midPoint.y + arcHeight,
          midPoint.z + sideOffset * 0.3
        );

        // 🎨 视觉样式
        const isHoverRelated = hoveredNode && (conn.source === hoveredNode.id || conn.target === hoveredNode.id);
        const isSelectedRelated = selectedNode && (conn.source === selectedNode.id || conn.target === selectedNode.id);
        const isHighlighted = isHoverRelated || isSelectedRelated;

        // 🌑 聚焦模式：计算是否应该变暗
        const shouldDim = (selectedNode && !isSelectedRelated) || (hoveredNode && !isHoverRelated && !selectedNode);

        // 颜色：使用连接定义的颜色，或根据类型选择
        let color = conn.visual?.color;
        if (!color) {
          if (isCoreConnection) color = '#FF00FF';  // 品红：骨架连接
          else if (isResourceConnection) color = source.visual?.color || '#00FFFF';  // 使用 category 的颜色
          else color = '#00FFFF';
        }

        // 线宽和透明度 - 更纤细的线条，聚焦模式下变暗
        const lineWidth = shouldDim ? 0.3 : (isHighlighted ? 2 : (isCoreConnection ? 1.2 : 0.8));
        const opacity = shouldDim ? 0.06 : (isHighlighted ? 0.85 : (isCoreConnection ? 0.5 : 0.3));

        // Use dashed <Line> for dashed connections, solid <QuadraticBezierLine> for others
        if (conn.visual?.dashed) {
          const arcPoints = buildArcPoints(start, end, arcHeight, sideOffset);
          return (
            <Line
              key={`conn-${conn.id}-${index}`}
              points={arcPoints}
              color={color}
              lineWidth={lineWidth}
              dashed
              dashSize={0.6}
              gapSize={0.4}
              transparent
              opacity={opacity}
            />
          );
        }

        return (
          <QuadraticBezierLine
            key={`conn-${conn.id}-${index}`}
            start={start}
            end={end}
            mid={controlPoint}
            color={color}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
          />
        );
      })}

      {/* 节点群组 - Split rendering: full PlanetNode + instanced */}
      <group ref={groupRef}>
        {/* Full PlanetNode for core/tool/hovered/selected/connected nodes */}
        {fullRenderNodes.map((node) => (
            <PlanetNode key={node.id} node={node} />
          ))}

        {/* Instanced rendering for remaining resource nodes */}
        {instancedNodes.length > 0 && (
          <InstancedPlanetNodes nodes={instancedNodes} />
        )}
      </group>

    </>
  );
}
