'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';

/**
 * Hooks Layer 详细视图组件
 *
 * 展示 Claude Code 的 Hooks 系统架构：
 * - PreToolUse: 工具执行前拦截（验证、参数修改）
 * - PostToolUse: 工具执行后处理（自动格式化、检查）
 * - Stop: 会话结束时（最终验证）
 *
 * 这是 Claude 调用链的核心路由层
 */

interface HookType {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  color: string;
  examples: string[];
  position: [number, number, number];
}

// 🔄 大幅增加间距，全部落在水平面上（Y=0），呈三角形分布
const HOOK_TYPES: HookType[] = [
  {
    id: 'pre-tool-use',
    name: 'PreToolUse',
    nameZh: '工具调用前',
    description: '在工具执行前拦截，用于验证参数、修改输入',
    color: '#10B981', // 绿色
    examples: [
      'tmux reminder - 长命令建议使用tmux',
      'git push review - 推送前打开编辑器审查',
      'doc blocker - 阻止创建不必要的文档'
    ],
    position: [-12, 0, -8],  // 🔄 左后方，水平面上
  },
  {
    id: 'post-tool-use',
    name: 'PostToolUse',
    nameZh: '工具调用后',
    description: '在工具执行后处理，用于自动格式化、检查结果',
    color: '#F59E0B', // 橙色
    examples: [
      'PR creation - 记录PR URL和Actions状态',
      'Prettier - 自动格式化JS/TS文件',
      'TypeScript check - 编辑后运行tsc',
      'console.log warning - 警告调试语句'
    ],
    position: [12, 0, -8],   // 🔄 右后方，水平面上
  },
  {
    id: 'stop',
    name: 'Stop',
    nameZh: '会话结束',
    description: '会话结束时执行，用于最终验证和清理',
    color: '#EF4444', // 红色
    examples: [
      'console.log audit - 检查所有修改文件中的console.log'
    ],
    position: [0, 0, 10],    // 🔄 前方中央，水平面上
  },
];

interface HooksLayerDetailProps {
  layoutPosition?: [number, number, number];
}

export default function HooksLayerDetail({ layoutPosition }: HooksLayerDetailProps) {
  const { selectedNode, hoveredNode } = useKnowledgeStore();
  const groupRef = useRef<THREE.Group>(null);
  const [activeHookType, setActiveHookType] = useState<string | null>(null);

  // 只在选中 layer-hooks 节点时显示
  const isVisible = selectedNode?.id === 'layer-hooks' || hoveredNode?.id === 'layer-hooks';

  // 动画：轻微旋转
  useFrame((state) => {
    if (groupRef.current && isVisible) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // 🔄 数据流动画粒子 - 改为水平面上的三角形路径
  const flowParticles = useMemo(() => {
    if (!isVisible) return null;

    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const t = i / particleCount;

      // 三角形路径：中心 → PreToolUse → PostToolUse → Stop → 出口
      let x: number, y: number, z: number;

      if (t < 0.25) {
        // 中心 → PreToolUse (左后)
        const segT = t / 0.25;
        x = -12 * segT;
        z = -8 * segT;
      } else if (t < 0.5) {
        // PreToolUse → PostToolUse (右后)
        const segT = (t - 0.25) / 0.25;
        x = -12 + 24 * segT;
        z = -8 - 2 * Math.sin(segT * Math.PI);
      } else if (t < 0.75) {
        // PostToolUse → Stop (前方)
        const segT = (t - 0.5) / 0.25;
        x = 12 - 12 * segT;
        z = -8 + 18 * segT;
      } else {
        // Stop → 出口
        const segT = (t - 0.75) / 0.25;
        x = 0;
        z = 10 + 5 * segT;
      }

      // Y保持在水平面附近，略微浮动
      y = Math.sin(i * 0.2) * 0.3;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // 渐变色：绿 → 橙 → 红 → 白
      if (t < 0.25) {
        colors[i3] = 0.06; colors[i3 + 1] = 0.72; colors[i3 + 2] = 0.51; // 绿
      } else if (t < 0.5) {
        colors[i3] = 0.96; colors[i3 + 1] = 0.62; colors[i3 + 2] = 0.04; // 橙
      } else if (t < 0.75) {
        colors[i3] = 0.94; colors[i3 + 1] = 0.27; colors[i3 + 2] = 0.27; // 红
      } else {
        colors[i3] = 1.0; colors[i3 + 1] = 1.0; colors[i3 + 2] = 1.0; // 白
      }
    }

    return { positions, colors };
  }, [isVisible]);

  if (!isVisible) return null;

  // 获取 layer-hooks 节点的位置 (优先使用布局计算位置)
  const basePosition = layoutPosition
    || (selectedNode?.id === 'layer-hooks' ? selectedNode.position : null)
    || hoveredNode?.position
    || [0, 0, 0];

  return (
    <group ref={groupRef} position={basePosition as [number, number, number]}>
      {/* 🔄 标题 - 调整到水平面上方便观看 */}
      <Text
        position={[0, 4, 0]}
        fontSize={1.5}
        color="#00FFFF"
        anchorX="center"
        anchorY="bottom"
        font="/fonts/Orbitron-Bold.ttf"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        HOOKS LAYER 架构
      </Text>

      <Text
        position={[0, 3, 0]}
        fontSize={0.7}
        color="#888888"
        anchorX="center"
        anchorY="bottom"
      >
        所有工具调用都会经过这里
      </Text>

      {/* 三种 Hook 类型 */}
      {HOOK_TYPES.map((hookType) => (
        <group
          key={hookType.id}
          position={hookType.position}
          onPointerOver={() => setActiveHookType(hookType.id)}
          onPointerOut={() => setActiveHookType(null)}
        >
          {/* 3D 几何体 */}
          <mesh>
            {hookType.id === 'pre-tool-use' && (
              <coneGeometry args={[1.5, 3, 6]} />
            )}
            {hookType.id === 'post-tool-use' && (
              <boxGeometry args={[2.5, 2.5, 2.5]} />
            )}
            {hookType.id === 'stop' && (
              <octahedronGeometry args={[1.5]} />
            )}
            <meshStandardMaterial
              color={hookType.color}
              emissive={hookType.color}
              emissiveIntensity={activeHookType === hookType.id ? 1.5 : 0.5}
              transparent
              opacity={activeHookType === hookType.id ? 1 : 0.8}
              wireframe={activeHookType !== hookType.id}
            />
          </mesh>

          {/* 发光环 */}
          {activeHookType === hookType.id && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[2, 0.1, 16, 64]} />
              <meshBasicMaterial color={hookType.color} transparent opacity={0.8} />
            </mesh>
          )}

          {/* 🔄 名称标签 - 调整到几何体上方 */}
          <Text
            position={[0, 3, 0]}
            fontSize={0.9}
            color={hookType.color}
            anchorX="center"
            anchorY="bottom"
            font="/fonts/Orbitron-Bold.ttf"
            outlineWidth={0.1}
            outlineColor="#000000"
          >
            {hookType.name}
          </Text>

          <Text
            position={[0, 2.2, 0]}
            fontSize={0.6}
            color="#AAAAAA"
            anchorX="center"
            anchorY="bottom"
          >
            {hookType.nameZh}
          </Text>

          {/* 🔄 详细信息（hover 时显示）- 调整位置到上方 */}
          {activeHookType === hookType.id && (
            <Html
              position={[0, 5, 0]}
              center
              style={{
                background: 'rgba(0, 0, 0, 0.95)',
                border: `2px solid ${hookType.color}`,
                borderRadius: '10px',
                padding: '16px 20px',
                width: '320px',
                pointerEvents: 'none',
                boxShadow: `0 0 20px ${hookType.color}40`,
              }}
            >
              <div style={{ color: hookType.color, fontSize: '15px', fontWeight: 'bold', marginBottom: '10px' }}>
                {hookType.description}
              </div>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                示例 Hooks:
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', color: '#ccc', fontSize: '12px' }}>
                {hookType.examples.map((example, idx) => (
                  <li key={`hook-example-${hookType.id}-${idx}`} style={{ marginBottom: '6px' }}>{example}</li>
                ))}
              </ul>
            </Html>
          )}
        </group>
      ))}

      {/* 🔄 连接线：数据流向 - 调整到水平面布局 */}
      {/* 入口（中心） → PreToolUse（左后） */}
      <Line
        points={[[0, 0, 0], [-6, 0, -4], [-12, 0, -8]]}
        color="#10B981"
        lineWidth={3}
        dashed
        dashScale={5}
      />

      {/* PreToolUse（左后） → PostToolUse（右后） */}
      <Line
        points={[[-12, 0, -8], [0, 0, -10], [12, 0, -8]]}
        color="#F59E0B"
        lineWidth={3}
        dashed
        dashScale={5}
      />

      {/* PostToolUse（右后） → Stop（前方） */}
      <Line
        points={[[12, 0, -8], [6, 0, 2], [0, 0, 10]]}
        color="#EF4444"
        lineWidth={3}
        dashed
        dashScale={5}
      />

      {/* Stop → 出口（向前延伸） */}
      <Line
        points={[[0, 0, 10], [0, 0, 15]]}
        color="#FFFFFF"
        lineWidth={3}
        dashed
        dashScale={3}
      />

      {/* 流动粒子 */}
      {flowParticles && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={flowParticles.positions.length / 3}
              array={flowParticles.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={flowParticles.colors.length / 3}
              array={flowParticles.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.2}
            vertexColors
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* 🔄 底部说明 - 调整位置 */}
      <Text
        position={[0, 2, -12]}
        fontSize={0.6}
        color="#666666"
        anchorX="center"
        anchorY="top"
        maxWidth={20}
        textAlign="center"
      >
        点击各个 Hook 类型查看详情{'\n'}
        优化建议: 在 settings.json 中配置 hooks 字段
      </Text>
    </group>
  );
}
