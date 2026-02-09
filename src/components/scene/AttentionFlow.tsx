'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';

// ============================================
// Surface offset helpers
// ============================================

function getShapeMultiplier(shape: string | undefined): number {
  switch (shape) {
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

interface NodeVisualInfo {
  size: number;
  shape?: string;
}

/**
 * Offset a position along a direction to reach the node surface.
 */
function offsetToSurface(
  center: THREE.Vector3,
  direction: THREE.Vector3,
  visual: NodeVisualInfo | undefined,
  outward: boolean
): THREE.Vector3 {
  if (!visual) return center.clone();
  const multiplier = getShapeMultiplier(visual.shape) * visual.size * 1.2;
  return center.clone().add(
    direction.clone().multiplyScalar(outward ? multiplier : -multiplier)
  );
}

// ============================================
// Curve generation - smooth CatmullRom curves
// with surface-to-surface endpoints
// ============================================

function createFlowCurve(
  rawStart: [number, number, number],
  rawEnd: [number, number, number],
  sourceVisual: NodeVisualInfo | undefined,
  targetVisual: NodeVisualInfo | undefined,
  index: number,
  total: number
): THREE.CatmullRomCurve3 {
  const rawS = new THREE.Vector3(...rawStart);
  const rawE = new THREE.Vector3(...rawEnd);
  const dist = rawS.distanceTo(rawE);

  if (dist < 0.01) {
    return new THREE.CatmullRomCurve3([rawS, rawE]);
  }

  // Direction from source → target
  const dir = new THREE.Vector3().subVectors(rawE, rawS).normalize();

  // Offset start/end to geometry surfaces
  const s = offsetToSurface(rawS, dir, sourceVisual, true);
  const e = offsetToSurface(rawE, dir, targetVisual, false);

  const up = new THREE.Vector3(0, 1, 0);
  const perp = new THREE.Vector3().crossVectors(dir, up).normalize();

  if (perp.lengthSq() < 0.001) {
    perp.crossVectors(dir, new THREE.Vector3(1, 0, 0)).normalize();
  }

  const surfaceDist = s.distanceTo(e);
  const mid = new THREE.Vector3().lerpVectors(s, e, 0.5);

  // Arc height proportional to distance, varied by index
  const baseArc = Math.min(surfaceDist * 0.2, 4);
  const arcVar = total > 1 ? ((index % 5) - 2) * Math.min(surfaceDist * 0.06, 1.0) : 0;
  mid.y += baseArc + arcVar;

  // Side offset perpendicular to connection line
  if (total > 2) {
    const sideVar = ((index % 7) - 3) * Math.min(surfaceDist * 0.04, 0.6);
    mid.add(perp.clone().multiplyScalar(sideVar));
  }

  // Intermediate control points for smooth shape
  const p1 = new THREE.Vector3().lerpVectors(s, mid, 0.33);
  p1.y = s.y + (mid.y - s.y) * 0.4;
  const p2 = new THREE.Vector3().lerpVectors(mid, e, 0.67);
  p2.y = e.y + (mid.y - e.y) * 0.4;

  return new THREE.CatmullRomCurve3([s, p1, mid, p2, e], false, 'centripetal', 0.5);
}

// ============================================
// Single animated dashed flow line
// ============================================

interface FlowLineProps {
  startPos: [number, number, number];
  endPos: [number, number, number];
  sourceVisual?: NodeVisualInfo;
  targetVisual?: NodeVisualInfo;
  color: string;
  speed: number;
  index: number;
  total: number;
  lineWidth?: number;
  opacity?: number;
  dashSize?: number;
  gapSize?: number;
}

function FlowLine({
  startPos, endPos, sourceVisual, targetVisual,
  color, speed, index, total,
  lineWidth = 1.5, opacity = 0.7, dashSize = 0.6, gapSize = 0.35,
}: FlowLineProps) {
  const lineRef = useRef<any>(null);

  const curvePoints = useMemo(() => {
    const curve = createFlowCurve(startPos, endPos, sourceVisual, targetVisual, index, total);
    return curve.getPoints(64);
  }, [startPos[0], startPos[1], startPos[2], endPos[0], endPos[1], endPos[2], index, total]);

  useFrame((state) => {
    const mat = lineRef.current?.material;
    if (mat && 'dashOffset' in mat) {
      mat.dashOffset = -state.clock.elapsedTime * speed;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={curvePoints}
      color={color}
      lineWidth={lineWidth}
      dashed
      dashSize={dashSize}
      gapSize={gapSize}
      transparent
      opacity={opacity}
    />
  );
}

// ============================================
// Flowing particles along curve
// ============================================

interface FlowParticlesProps {
  startPos: [number, number, number];
  endPos: [number, number, number];
  sourceVisual?: NodeVisualInfo;
  targetVisual?: NodeVisualInfo;
  color: string;
  speed: number;
  index: number;
  total: number;
  count?: number;
}

function FlowParticles({
  startPos, endPos, sourceVisual, targetVisual,
  color, speed, index, total, count = 6,
}: FlowParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const curve = useMemo(
    () => createFlowCurve(startPos, endPos, sourceVisual, targetVisual, index, total),
    [startPos[0], startPos[1], startPos[2], endPos[0], endPos[1], endPos[2], index, total]
  );

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const t = ((i / count + time * speed * 0.15) % 1.0);
      const clamped = Math.max(0.001, Math.min(0.999, t));
      const pos = curve.getPointAt(clamped);

      posAttr.array[i * 3] = pos.x;
      posAttr.array[i * 3 + 1] = pos.y;
      posAttr.array[i * 3 + 2] = pos.z;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={0.12}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ============================================
// Helper to extract visual info from a node
// ============================================

function getNodeVisual(node: { visual?: { size?: number; shape?: string }; type?: string }): NodeVisualInfo {
  if (node.visual?.size) {
    return { size: node.visual.size, shape: node.visual.shape };
  }
  // Fallback based on type (matches PlanetNode sizing)
  if (node.type === 'category') return { size: 1.8, shape: 'octahedron' };
  if (node.type === 'skill' || node.type === 'mcp') return { size: 1.2, shape: node.type === 'skill' ? 'cube' : 'cylinder' };
  return { size: 0.8, shape: 'sphere' };
}

// ============================================
// Main AttentionFlow component
// ============================================

export default function AttentionFlow() {
  const { selectedNode, connections, nodes, hoveredNode } = useKnowledgeStore();

  // Simulation mode state
  const [simulationPhase, setSimulationPhase] = useState(0);
  const [simulationActive, setSimulationActive] = useState(true);

  useEffect(() => {
    if (selectedNode || hoveredNode) {
      setSimulationActive(false);
      return;
    }
    setSimulationActive(true);
    const interval = setInterval(() => {
      setSimulationPhase((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedNode, hoveredNode]);

  // Simulation stages
  const simulationStages = useMemo(
    () => [
      { name: '\u63A5\u6536\u8BF7\u6C42', from: 'center', toIds: ['layer-hooks'], color: '#00FFFF' },
      { name: '\u8DEF\u7531\u5230\u5206\u7C7B', from: 'layer-hooks', toIds: ['category-skills', 'category-mcp', 'category-plugins'], color: '#FF00FF' },
      { name: '\u6267\u884C Hooks', from: 'layer-hooks', toIds: ['category-hooks', 'category-rules'], color: '#EF4444' },
      { name: '\u5B58\u50A8\u8BB0\u5FC6', from: 'layer-hooks', toIds: ['category-memory', 'category-agents'], color: '#14B8A6' },
    ],
    []
  );

  // ========== Selected node connections ==========
  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];
    return connections
      .filter((conn) => conn.source === selectedNode.id || conn.target === selectedNode.id)
      .map((conn, i, arr) => {
        const source = nodes.find((n) => n.id === conn.source);
        const target = nodes.find((n) => n.id === conn.target);
        if (!source || !target) return null;

        const isSender = conn.source === selectedNode.id;
        return {
          id: conn.id,
          startPos: source.position,
          endPos: target.position,
          sourceVisual: getNodeVisual(source),
          targetVisual: getNodeVisual(target),
          color: isSender ? '#00FFFF' : '#FFA500',
          speed: isSender ? 0.8 : 0.4,
          index: i,
          total: arr.length,
        };
      })
      .filter(Boolean) as {
      id: string;
      startPos: [number, number, number];
      endPos: [number, number, number];
      sourceVisual: NodeVisualInfo;
      targetVisual: NodeVisualInfo;
      color: string;
      speed: number;
      index: number;
      total: number;
    }[];
  }, [selectedNode, connections, nodes]);

  // ========== Simulation lines ==========
  const simulationLines = useMemo(() => {
    if (!simulationActive || selectedNode || hoveredNode) return [];

    const stage = simulationStages[simulationPhase];
    const sourceNode = nodes.find((n) => n.id === stage.from);
    if (!sourceNode) return [];

    const targetNodes = nodes.filter((n) => stage.toIds.includes(n.id));

    return targetNodes.slice(0, 5).map((target, i, arr) => ({
      id: `sim-${sourceNode.id}-${target.id}`,
      startPos: sourceNode.position,
      endPos: target.position,
      sourceVisual: getNodeVisual(sourceNode),
      targetVisual: getNodeVisual(target),
      color: stage.color,
      speed: 0.5,
      index: i,
      total: arr.length,
    }));
  }, [simulationActive, simulationPhase, simulationStages, nodes, selectedNode, hoveredNode]);

  // Stage label position
  const stageLabelPosition = useMemo(() => {
    if (!simulationActive || selectedNode || hoveredNode) return null;
    const stage = simulationStages[simulationPhase];
    const sourceNode = nodes.find((n) => n.id === stage.from);
    if (!sourceNode) return null;
    return [sourceNode.position[0], sourceNode.position[1] + 3, sourceNode.position[2]] as [number, number, number];
  }, [simulationActive, simulationPhase, simulationStages, nodes, selectedNode, hoveredNode]);

  return (
    <group>
      {/* ========== Selected node mode ========== */}
      {selectedNode &&
        selectedConnections.map((conn) => (
          <group key={conn.id}>
            <FlowLine
              startPos={conn.startPos}
              endPos={conn.endPos}
              sourceVisual={conn.sourceVisual}
              targetVisual={conn.targetVisual}
              color={conn.color}
              speed={conn.speed}
              index={conn.index}
              total={conn.total}
              lineWidth={2}
              opacity={0.85}
              dashSize={0.6}
              gapSize={0.35}
            />
            <FlowParticles
              startPos={conn.startPos}
              endPos={conn.endPos}
              sourceVisual={conn.sourceVisual}
              targetVisual={conn.targetVisual}
              color={conn.color}
              speed={conn.speed}
              index={conn.index}
              total={conn.total}
            />
          </group>
        ))}

      {/* ========== Simulation mode ========== */}
      {simulationActive && !selectedNode && !hoveredNode && (
        <>
          {simulationLines.map((line) => (
            <group key={line.id}>
              <FlowLine
                startPos={line.startPos}
                endPos={line.endPos}
                sourceVisual={line.sourceVisual}
                targetVisual={line.targetVisual}
                color={line.color}
                speed={line.speed}
                index={line.index}
                total={line.total}
                lineWidth={1.5}
                opacity={0.7}
                dashSize={0.5}
                gapSize={0.3}
              />
              <FlowParticles
                startPos={line.startPos}
                endPos={line.endPos}
                sourceVisual={line.sourceVisual}
                targetVisual={line.targetVisual}
                color={line.color}
                speed={line.speed}
                index={line.index}
                total={line.total}
                count={4}
              />
            </group>
          ))}

          {stageLabelPosition && (
            <Text
              position={stageLabelPosition}
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
