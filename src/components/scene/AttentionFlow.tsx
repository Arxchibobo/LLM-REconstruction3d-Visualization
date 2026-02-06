'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';

/**
 * Claude 注意力流可视化组件
 * 展示数据如何从中心 Claude 节点流向各个工具节点
 * 实现用户需求："展示模型的注意力机制是怎么运作的"
 *
 * 功能：
 * 1. 选中节点时显示相关的数据流动
 * 2. 自动模拟模式：展示 Claude 的典型运作流程
 */
export default function AttentionFlow() {
  const { selectedNode, connections, nodes, hoveredNode } = useKnowledgeStore();
  const particlesRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.Group>(null);

  // 模拟模式：当没有选中节点时，自动展示数据流动
  const [simulationPhase, setSimulationPhase] = useState(0);
  const [simulationActive, setSimulationActive] = useState(true);

  // 模拟阶段循环（每4秒切换一个阶段，更平滑）
  useEffect(() => {
    if (selectedNode || hoveredNode) {
      setSimulationActive(false);
      return;
    }

    setSimulationActive(true);
    const interval = setInterval(() => {
      // 4个阶段循环
      setSimulationPhase((prev) => (prev + 1) % 4);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedNode, hoveredNode]);

  /**
   * 🎬 模拟流程的各个阶段
   * 注意：这里的动画与 KnowledgeGraph 的静态连接线互补
   * - KnowledgeGraph 显示骨架连接（layer-hooks → categories）
   * - AttentionFlow 显示动态数据流（center → layer-hooks，以及交互时的路径）
   */
  const simulationStages = useMemo(() => [
    // 阶段1: 请求从中心发出到路由层
    { name: '接收请求', from: 'center', toIds: ['layer-hooks'], color: '#00FFFF' },
    // 阶段2: 路由层分发到各分类
    { name: '路由到分类', from: 'layer-hooks', toIds: ['category-skills', 'category-mcp', 'category-plugins'], color: '#FF00FF' },
    // 阶段3: 执行钩子和规则
    { name: '执行 Hooks', from: 'layer-hooks', toIds: ['category-hooks', 'category-rules'], color: '#EF4444' },
    // 阶段4: 调用具体工具（跳过，因为连接线太多会很乱）
    // { name: '调用工具', from: 'center', toTypes: ['skill', 'mcp', 'plugin'], color: '#10B981' },
    // 阶段5: 访问记忆和代理
    { name: '存储记忆', from: 'layer-hooks', toIds: ['category-memory', 'category-agents'], color: '#14B8A6' },
  ], []);

  // 🌊 创建注意力流粒子（改进版：更大、更清晰）
  const attentionParticles = useMemo(() => {
    if (!selectedNode) return null;

    // 找到与选中节点相关的所有连接
    const relatedConnections = connections.filter(
      (conn) => conn.source === selectedNode.id || conn.target === selectedNode.id
    );

    // 为每条连接生成流动粒子（增加到30个，更密集）
    const particleCount = relatedConnections.length * 30;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    relatedConnections.forEach((conn, connIdx) => {
      const sourceNode = nodes.find((n) => n.id === conn.source);
      const targetNode = nodes.find((n) => n.id === conn.target);

      if (!sourceNode || !targetNode) return;

      const startPos = new THREE.Vector3(...sourceNode.position);
      const endPos = new THREE.Vector3(...targetNode.position);

      // 在连接线上生成30个粒子
      for (let i = 0; i < 30; i++) {
        const particleIdx = connIdx * 30 + i;
        const idx3 = particleIdx * 3;

        // 沿着连接线插值位置
        const t = i / 30;
        const pos = new THREE.Vector3().lerpVectors(startPos, endPos, t);

        positions[idx3] = pos.x;
        positions[idx3 + 1] = pos.y;
        positions[idx3 + 2] = pos.z;

        // 出站连接用纯青色，入站连接用纯橙色（更容易区分）
        const isSender = conn.source === selectedNode.id;
        if (isSender) {
          // 青色 (#00FFFF) - Claude向外发送数据
          colors[idx3] = 0.0;
          colors[idx3 + 1] = 1.0;
          colors[idx3 + 2] = 1.0;
        } else {
          // 橙色 (#FFA500) - 数据流向Claude
          colors[idx3] = 1.0;
          colors[idx3 + 1] = 0.65;
          colors[idx3 + 2] = 0.0;
        }

        // 粒子大小：头部大，尾部小（形成箭头效果）
        const sizeGradient = 1.0 - (i / 30) * 0.3; // 1.0 → 0.7（尾部不要太小）
        sizes[particleIdx] = 0.5 * sizeGradient; // 大幅增大基础尺寸（从0.15改为0.5）
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }, [selectedNode, connections, nodes]);

  // 🎬 动画：让粒子沿着连接线流动（改进版：更清晰的方向感）
  useFrame((state) => {
    if (!particlesRef.current || !selectedNode) return;

    const time = state.clock.elapsedTime;
    const positions = particlesRef.current.geometry.attributes.position;
    const sizes = particlesRef.current.geometry.attributes.size;

    if (!positions || !positions.array) return;

    const relatedConnections = connections.filter(
      (conn) => conn.source === selectedNode.id || conn.target === selectedNode.id
    );

    relatedConnections.forEach((conn, connIdx) => {
      const sourceNode = nodes.find((n) => n.id === conn.source);
      const targetNode = nodes.find((n) => n.id === conn.target);

      if (!sourceNode || !targetNode) return;

      const startPos = new THREE.Vector3(...sourceNode.position);
      const endPos = new THREE.Vector3(...targetNode.position);
      const isSender = conn.source === selectedNode.id;

      // 出站快（0.5），入站慢（0.2），更容易区分方向
      const flowSpeed = isSender ? 0.5 : 0.2;

      // 更新这条连接的30个粒子
      for (let i = 0; i < 30; i++) {
        const particleIdx = connIdx * 30 + i;
        const idx3 = particleIdx * 3;

        // 让粒子沿着路径流动（循环）
        const t = ((i / 30 + time * flowSpeed) % 1.0);
        const pos = new THREE.Vector3().lerpVectors(startPos, endPos, t);

        positions.array[idx3] = pos.x;
        positions.array[idx3 + 1] = pos.y;
        positions.array[idx3 + 2] = pos.z;

        // 粒子大小：头部大，尾部小（箭头效果）
        const sizeGradient = Math.pow(1.0 - t, 0.3); // 更平缓的衰减
        sizes.array[particleIdx] = 0.6 * sizeGradient; // 大幅增大（从0.2改为0.6）
      }
    });

    positions.needsUpdate = true;
    sizes.needsUpdate = true;
  });

  // 🎨 渲染连接线（高亮显示选中节点的连接，改进配色）
  const highlightedLines = useMemo(() => {
    if (!selectedNode) return [];

    const relatedConnections = connections.filter(
      (conn) => conn.source === selectedNode.id || conn.target === selectedNode.id
    );

    return relatedConnections.map((conn) => {
      const sourceNode = nodes.find((n) => n.id === conn.source);
      const targetNode = nodes.find((n) => n.id === conn.target);

      if (!sourceNode || !targetNode) return null;

      const isSender = conn.source === selectedNode.id;
      // 青色=Claude输出，橙色=数据输入
      const color = isSender ? '#00FFFF' : '#FFA500';

      return {
        id: conn.id,
        points: [sourceNode.position, targetNode.position],
        color,
        isSender, // 添加方向标识
      };
    }).filter(Boolean);
  }, [selectedNode, connections, nodes]);

  // 模拟模式的连接线
  const simulationLines = useMemo(() => {
    if (!simulationActive || selectedNode || hoveredNode) return [];

    const stage = simulationStages[simulationPhase];
    const sourceNode = nodes.find((n) => n.id === stage.from);
    if (!sourceNode) return [];

    // 🆕 支持 toIds（精确匹配）和 toTypes（类型匹配）
    let targetNodes: typeof nodes = [];
    if ('toIds' in stage && stage.toIds) {
      targetNodes = nodes.filter((n) => (stage.toIds as string[]).includes(n.id));
    } else if ('toTypes' in stage && stage.toTypes) {
      targetNodes = nodes.filter((n) => (stage.toTypes as string[]).includes(n.type));
    }

    return targetNodes.slice(0, 5).map((target) => ({
      id: `sim-${sourceNode.id}-${target.id}`,
      points: [sourceNode.position, target.position],
      color: stage.color,
      label: stage.name,
    }));
  }, [simulationActive, simulationPhase, simulationStages, nodes, selectedNode, hoveredNode]);

  // 模拟模式的粒子
  const simulationParticles = useMemo(() => {
    if (!simulationActive || selectedNode || hoveredNode || simulationLines.length === 0) return null;

    const particleCount = simulationLines.length * 20;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const stage = simulationStages[simulationPhase];
    const color = new THREE.Color(stage.color);

    simulationLines.forEach((line, lineIdx) => {
      const startPos = new THREE.Vector3(...line.points[0]);
      const endPos = new THREE.Vector3(...line.points[1]);

      for (let i = 0; i < 20; i++) {
        const idx = lineIdx * 20 + i;
        const idx3 = idx * 3;
        const t = i / 20;
        const pos = new THREE.Vector3().lerpVectors(startPos, endPos, t);

        positions[idx3] = pos.x;
        positions[idx3 + 1] = pos.y;
        positions[idx3 + 2] = pos.z;

        colors[idx3] = color.r;
        colors[idx3 + 1] = color.g;
        colors[idx3 + 2] = color.b;
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [simulationActive, simulationLines, simulationPhase, simulationStages, selectedNode, hoveredNode]);

  // 模拟粒子引用
  const simParticlesRef = useRef<THREE.Points>(null);

  // 模拟粒子动画
  useFrame((state) => {
    if (!simParticlesRef.current || !simulationActive || selectedNode || hoveredNode) return;

    const time = state.clock.elapsedTime;
    const positions = simParticlesRef.current.geometry.attributes.position;
    if (!positions || !positions.array) return;

    simulationLines.forEach((line, lineIdx) => {
      const startPos = new THREE.Vector3(...line.points[0]);
      const endPos = new THREE.Vector3(...line.points[1]);

      for (let i = 0; i < 20; i++) {
        const idx = lineIdx * 20 + i;
        const idx3 = idx * 3;
        const t = ((i / 20 + time * 0.3) % 1.0);
        const pos = new THREE.Vector3().lerpVectors(startPos, endPos, t);

        positions.array[idx3] = pos.x;
        positions.array[idx3 + 1] = pos.y;
        positions.array[idx3 + 2] = pos.z;
      }
    });

    positions.needsUpdate = true;
  });

  // 获取当前阶段标签位置
  const stageLabelPosition = useMemo(() => {
    if (!simulationActive || selectedNode || hoveredNode) return null;
    const stage = simulationStages[simulationPhase];
    const sourceNode = nodes.find((n) => n.id === stage.from);
    if (!sourceNode) return null;

    return [sourceNode.position[0], sourceNode.position[1] + 3, sourceNode.position[2]];
  }, [simulationActive, simulationPhase, simulationStages, nodes, selectedNode, hoveredNode]);

  return (
    <group ref={linesRef}>
      {/* ========== 选中节点模式 ========== */}
      {selectedNode && attentionParticles && (
        <>
          {/* 高亮连接线（超粗、超亮） */}
          {highlightedLines.map((line: any) => (
            <Line
              key={line.id}
              points={line.points}
              color={line.color}
              lineWidth={6}
              transparent
              opacity={1.0}
              dashed={false}
            />
          ))}

          {/* 流动粒子（超大、超亮） */}
          <points ref={particlesRef} geometry={attentionParticles}>
            <pointsMaterial
              vertexColors
              size={0.8}
              transparent
              opacity={1.0}
              blending={THREE.AdditiveBlending}
              sizeAttenuation={true}
              depthWrite={false}
            />
          </points>
        </>
      )}

      {/* ========== 模拟模式 ========== */}
      {simulationActive && !selectedNode && !hoveredNode && (
        <>
          {/* 模拟连接线 */}
          {simulationLines.map((line) => (
            <Line
              key={line.id}
              points={line.points}
              color={line.color}
              lineWidth={3}
              transparent
              opacity={0.8}
              dashed={false}
            />
          ))}

          {/* 模拟流动粒子 */}
          {simulationParticles && (
            <points ref={simParticlesRef} geometry={simulationParticles}>
              <pointsMaterial
                vertexColors
                size={0.5}
                transparent
                opacity={0.9}
                blending={THREE.AdditiveBlending}
                sizeAttenuation={true}
                depthWrite={false}
              />
            </points>
          )}

          {/* 阶段标签 */}
          {stageLabelPosition && (
            <Text
              position={stageLabelPosition as [number, number, number]}
              fontSize={0.8}
              color={simulationStages[simulationPhase].color}
              anchorX="center"
              anchorY="bottom"
              font="/fonts/Orbitron-Bold.ttf"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              {simulationStages[simulationPhase].name}
            </Text>
          )}
        </>
      )}
    </group>
  );
}
