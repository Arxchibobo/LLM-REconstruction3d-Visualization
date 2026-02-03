'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { Line } from '@react-three/drei';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import {
  computeRadialLayout,
  computeSphereLayout,
  computeSpiralLayout,
  computeHierarchicalLayout,
  computeOrbitalLayout,
} from '@/utils/layout';
import type { KnowledgeNode } from '@/types/knowledge';
import PlanetNode from './PlanetNode';
import CenterRobot from './CenterRobot';

export default function KnowledgeGraph() {
  const groupRef = useRef<Group>(null);
  const {
    nodes,
    connections,
    searchQuery,
    searchNodes,
    layoutType,
    hoveredNode,
    enabledNodeTypes  // 🆕 获取启用的节点类型
  } = useKnowledgeStore();

  // 搜索和类型过滤节点
  const filteredNodes = useMemo(() => {
    // 先按搜索查询过滤
    let result = searchQuery.trim() ? searchNodes(searchQuery) : nodes;

    // 再按节点类型过滤
    result = result.filter(node => enabledNodeTypes.has(node.type));

    return result;
  }, [nodes, searchQuery, searchNodes, enabledNodeTypes]);

  // 使用布局算法计算节点位置
  const layout = useMemo(() => {
    if (filteredNodes.length === 0) return { nodes: [], nodeMap: {} };

    console.log(`Computing ${layoutType} layout for ${filteredNodes.length} nodes...`);
    const startTime = performance.now();

    let result;
    switch (layoutType) {
      case 'orbital':
        // 🪐 轨道布局（默认）
        result = computeOrbitalLayout(filteredNodes, connections);
        break;
      case 'force':
        // 改用放射状布局替代力导向布局
        result = computeRadialLayout(filteredNodes, 15, 3);
        break;
      case 'circular':
        // 改用球形布局
        result = computeSphereLayout(filteredNodes, 20);
        break;
      case 'grid':
        // 改用螺旋布局
        result = computeSpiralLayout(filteredNodes, 3);
        break;
      case 'hierarchical':
        result = computeHierarchicalLayout(filteredNodes, connections, 10, 5);
        break;
      default:
        result = computeOrbitalLayout(filteredNodes, connections);
    }

    const endTime = performance.now();
    console.log(`Layout computed in ${(endTime - startTime).toFixed(2)}ms`);

    return result;
  }, [filteredNodes, connections, layoutType]);

  // 整体旋转动画
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.3;
    }
  });

  // 当搜索结果为空时显示消息
  if (filteredNodes.length === 0) {
    return null;
  }

  // 过滤掉中心节点（已由CenterRobot独立渲染）
  const planetsToRender = layout.nodes.filter((node) => node.id !== 'center');

  /**
   * 🔗 连接线系统（Phase 2.2）
   * 默认隐藏所有连接线，hover 时显示相关连接
   */
  const visibleConnections = useMemo(() => {
    // 如果没有 hover 节点，不显示任何连接线
    if (!hoveredNode) return [];

    // 找到 hover 节点在同一轨道的最近 3 个节点
    const hoveredOrbit = hoveredNode.orbit || 3;
    const sameOrbitNodes = layout.nodes.filter(
      (node) => node.orbit === hoveredOrbit && node.id !== hoveredNode.id
    );

    // 计算距离并排序
    const hoveredPos = new Vector3(...hoveredNode.position);
    const nearestNodes = sameOrbitNodes
      .map((node) => ({
        node,
        distance: hoveredPos.distanceTo(new Vector3(...node.position)),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map((item) => item.node.id);

    // 相关节点 = 中心机器人 + 同轨道最近 3 个
    const relevantNodeIds = new Set([
      'center',
      hoveredNode.id,
      ...nearestNodes,
    ]);

    // 过滤出相关连接
    const relevantConnections = connections.filter((conn) => {
      const sourceRelevant = relevantNodeIds.has(conn.source);
      const targetRelevant = relevantNodeIds.has(conn.target);
      // 只显示涉及 hover 节点的连接
      return (
        (conn.source === hoveredNode.id || conn.target === hoveredNode.id) &&
        (sourceRelevant || targetRelevant)
      );
    });

    console.log(
      `🔗 Hover: ${hoveredNode.title} (轨道 ${hoveredOrbit}) → 显示 ${relevantConnections.length} 条连接`
    );

    return relevantConnections;
  }, [hoveredNode, connections, layout.nodes]);

  return (
    <>
      {/* 中心机器人 */}
      <CenterRobot />

      {/* 连接线 - 仅在 hover 时显示（Phase 2.2） */}
      {visibleConnections.map((conn) => {
        const source = layout.nodeMap[conn.source];
        const target = layout.nodeMap[conn.target];

        // 如果源节点或目标节点不存在（被过滤或不在布局中），跳过
        if (!source || !target) return null;

        // 创建曲线路径（添加轻微弧度）
        const start = new Vector3(...source.position);
        const end = new Vector3(...target.position);
        const mid = new Vector3()
          .addVectors(start, end)
          .multiplyScalar(0.5)
          .add(new Vector3(0, 2, 0)); // 向上弯曲

        return (
          <Line
            key={conn.id}
            points={[start, mid, end]} // 使用中间点创建曲线
            color={conn.visual?.color || '#00FFFF'}
            lineWidth={conn.visual?.width || 1.2}
            transparent
            opacity={0.25} // 低透明度（< 30%）
          />
        );
      })}

      {/* 节点群组 */}
      <group ref={groupRef}>
        {/* 渲染星球节点 - 过滤掉中心节点（已由CenterRobot独立渲染） */}
        {planetsToRender.map((node) => (
          <PlanetNode key={node.id} node={node} />
        ))}
      </group>
    </>
  );
}
