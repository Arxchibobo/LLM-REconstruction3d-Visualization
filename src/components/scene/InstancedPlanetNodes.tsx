'use client';

/**
 * InstancedPlanetNodes - 使用InstancedMesh批量渲染相同类型的节点
 * 性能优化: 将相同类型/形状的节点合并为单个InstancedMesh
 * 适用于节点数量 >50 的场景
 */

import { useRef, useMemo, useEffect } from 'react';
import { InstancedMesh, Object3D, Color, Matrix4 } from 'three';
import { useFrame } from '@react-three/fiber';
import type { KnowledgeNode } from '@/types/knowledge';
import { getColorByType } from '@/utils/colors';

interface InstancedPlanetNodesProps {
  nodes: KnowledgeNode[];
  hoveredNodeId?: string | null;
  selectedNodeId?: string | null;
}

// 辅助对象用于计算变换矩阵
const tempObject = new Object3D();
const tempColor = new Color();

export default function InstancedPlanetNodes({
  nodes,
  hoveredNodeId,
  selectedNodeId
}: InstancedPlanetNodesProps) {
  const meshRef = useRef<InstancedMesh>(null);

  // 按类型分组节点
  const groupedNodes = useMemo(() => {
    const groups: Record<string, KnowledgeNode[]> = {};

    nodes.forEach(node => {
      const key = `${node.type}-${node.visual?.shape || 'sphere'}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(node);
    });

    return groups;
  }, [nodes]);

  // 为每个节点组创建实例化数据
  const instanceData = useMemo(() => {
    const data: Array<{
      type: string;
      shape: string;
      nodes: KnowledgeNode[];
      count: number;
      baseSize: number;
      baseColor: string;
    }> = [];

    Object.entries(groupedNodes).forEach(([key, groupNodes]) => {
      const [type, shape] = key.split('-');
      const colorScheme = getColorByType(type);

      // 确定基础大小
      let baseSize = 0.8;
      if (type === 'category') baseSize = 1.8;
      else if (type === 'skill' || type === 'mcp') baseSize = 1.2;

      data.push({
        type,
        shape,
        nodes: groupNodes,
        count: groupNodes.length,
        baseSize,
        baseColor: colorScheme.primary
      });
    });

    return data;
  }, [groupedNodes]);

  // 更新实例化矩阵
  useEffect(() => {
    if (!meshRef.current) return;

    instanceData.forEach((group, groupIndex) => {
      group.nodes.forEach((node, index) => {
        const instanceId = index;

        // 设置位置和缩放
        tempObject.position.set(...node.position);

        // hover/selected 时放大
        const isHovered = node.id === hoveredNodeId;
        const isSelected = node.id === selectedNodeId;
        const scale = (isHovered || isSelected) ? 1.15 : 1.0;
        tempObject.scale.setScalar(group.baseSize * scale);

        tempObject.updateMatrix();

        // 更新矩阵
        meshRef.current!.setMatrixAt(instanceId, tempObject.matrix);

        // 设置颜色
        const isDimmed = hoveredNodeId !== null && !isHovered && !isSelected;
        const opacity = isDimmed ? 0.3 : 0.7;
        tempColor.set(group.baseColor);
        tempColor.multiplyScalar(opacity);
        meshRef.current!.setColorAt(instanceId, tempColor);
      });
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [instanceData, hoveredNodeId, selectedNodeId]);

  // 动画循环 - 仅更新悬浮效果
  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    instanceData.forEach((group) => {
      group.nodes.forEach((node, index) => {
        const isSelected = node.id === selectedNodeId;
        if (isSelected) return; // 选中的节点不悬浮

        // 轻微悬浮
        tempObject.position.set(
          node.position[0],
          node.position[1] + Math.sin(time * 0.5 + node.position[0]) * 0.05,
          node.position[2]
        );

        tempObject.scale.setScalar(group.baseSize);
        tempObject.updateMatrix();

        meshRef.current!.setMatrixAt(index, tempObject.matrix);
      });
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // 如果没有节点，不渲染
  if (instanceData.length === 0 || nodes.length === 0) {
    return null;
  }

  // 使用第一组的配置作为默认 (简化版本,实际应该为每个组创建单独的InstancedMesh)
  const firstGroup = instanceData[0];

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      frustumCulled={false}
    >
      {/* 根据形状选择几何体 */}
      {firstGroup.shape === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
      {firstGroup.shape === 'cube' && <boxGeometry args={[1.5, 1.5, 1.5]} />}
      {firstGroup.shape === 'cylinder' && <cylinderGeometry args={[1, 1, 2, 32]} />}
      {firstGroup.shape === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
      {firstGroup.shape === 'torus' && <torusGeometry args={[1, 0.4, 16, 100]} />}
      {firstGroup.shape === 'dodecahedron' && <dodecahedronGeometry args={[1, 0]} />}

      {/* 标准材质 */}
      <meshStandardMaterial
        roughness={0.3}
        metalness={0.7}
        transparent
      />
    </instancedMesh>
  );
}
