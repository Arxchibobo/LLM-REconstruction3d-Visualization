'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text, Billboard } from '@react-three/drei';
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
 * Compute start & end positions offset to geometry surfaces along the connection direction.
 */
function computeSurfaceEndpoints(
  sourcePos: [number, number, number],
  targetPos: [number, number, number],
  sourceVisual: NodeVisualInfo | undefined,
  targetVisual: NodeVisualInfo | undefined
): { start: THREE.Vector3; end: THREE.Vector3 } {
  const s = new THREE.Vector3(...sourcePos);
  const t = new THREE.Vector3(...targetPos);
  const dist = s.distanceTo(t);

  if (dist < 0.01) {
    return { start: s, end: t };
  }

  const dir = new THREE.Vector3().subVectors(t, s).normalize();

  const sourceOffset = sourceVisual
    ? getShapeMultiplier(sourceVisual.shape) * sourceVisual.size * 1.2
    : 0;
  const targetOffset = targetVisual
    ? getShapeMultiplier(targetVisual.shape) * targetVisual.size * 1.2
    : 0;

  const start = s.clone().add(dir.clone().multiplyScalar(sourceOffset));
  const end = t.clone().sub(dir.clone().multiplyScalar(targetOffset));

  return { start, end };
}

/**
 * Build a gentle arc between start and end with a small upward lift.
 */
function buildArcPoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  arcFraction: number = 0.15,
  segments: number = 32
): THREE.Vector3[] {
  const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
  const dist = start.distanceTo(end);
  mid.y += Math.min(dist * arcFraction, 4);

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  return curve.getPoints(segments);
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
  lineWidth?: number;
  opacity?: number;
}

function FlowLine({
  startPos, endPos, sourceVisual, targetVisual,
  color, speed,
  lineWidth = 1.5, opacity = 0.6,
}: FlowLineProps) {
  const lineRef = useRef<any>(null);

  const points = useMemo(() => {
    const { start, end } = computeSurfaceEndpoints(startPos, endPos, sourceVisual, targetVisual);
    return buildArcPoints(start, end);
  }, [startPos[0], startPos[1], startPos[2], endPos[0], endPos[1], endPos[2]]);

  useFrame((state) => {
    const mat = lineRef.current?.material;
    if (mat && 'dashOffset' in mat) {
      mat.dashOffset = -state.clock.elapsedTime * speed;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={lineWidth}
      dashed
      dashSize={0.6}
      gapSize={0.35}
      transparent
      opacity={opacity}
    />
  );
}

// ============================================
// Helper to extract visual info from a node
// ============================================

function getNodeVisual(node: { visual?: { size?: number; shape?: string }; type?: string }): NodeVisualInfo {
  if (node.visual?.size) {
    return { size: node.visual.size, shape: node.visual.shape };
  }
  if (node.type === 'category') return { size: 1.8, shape: 'octahedron' };
  if (node.type === 'skill' || node.type === 'mcp') return { size: 1.2, shape: node.type === 'skill' ? 'cube' : 'cylinder' };
  return { size: 0.8, shape: 'sphere' };
}

// ============================================
// Main AttentionFlow component
// ============================================

export default function AttentionFlow() {
  const { selectedNode, connections, hoveredNode, layoutNodeMap } = useKnowledgeStore();

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
      setSimulationPhase((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedNode, hoveredNode]);

  // Don't render anything until layout positions are available
  const hasLayout = Object.keys(layoutNodeMap).length > 0;

  // Simulation stages - center → categories directly
  const simulationStages = useMemo(
    () => [
      { name: '\u8DEF\u7531\u5230\u5DE5\u5177', from: 'center', toIds: ['category-skills', 'category-mcp', 'category-plugins'], color: '#FF00FF' },
      { name: '\u6267\u884C Hooks', from: 'center', toIds: ['category-hooks', 'category-rules'], color: '#EF4444' },
      { name: '\u5B58\u50A8\u8BB0\u5FC6', from: 'center', toIds: ['category-memory', 'category-agents'], color: '#14B8A6' },
    ],
    []
  );

  // ========== Selected node connections ==========
  const selectedConnections = useMemo(() => {
    if (!selectedNode || !hasLayout) return [];
    return connections
      .filter((conn) => conn.source === selectedNode.id || conn.target === selectedNode.id)
      .map((conn) => {
        const source = layoutNodeMap[conn.source];
        const target = layoutNodeMap[conn.target];
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
    }[];
  }, [selectedNode, connections, layoutNodeMap, hasLayout]);

  // ========== Simulation lines ==========
  const simulationLines = useMemo(() => {
    if (!simulationActive || selectedNode || hoveredNode || !hasLayout) return [];

    const stage = simulationStages[simulationPhase];

    // Resolve source position: center node is always at [0,0,0]
    let sourcePos: [number, number, number];
    let sourceVisual: NodeVisualInfo;
    if (stage.from === 'center') {
      sourcePos = [0, 0, 0];
      sourceVisual = { size: 2.0, shape: 'dodecahedron' };
    } else {
      const sourceNode = layoutNodeMap[stage.from];
      if (!sourceNode) return [];
      sourcePos = sourceNode.position;
      sourceVisual = getNodeVisual(sourceNode);
    }

    return stage.toIds
      .map((targetId) => {
        const targetNode = layoutNodeMap[targetId];
        if (!targetNode) return null;
        return {
          id: `sim-${stage.from}-${targetId}`,
          startPos: sourcePos,
          endPos: targetNode.position,
          sourceVisual,
          targetVisual: getNodeVisual(targetNode),
          color: stage.color,
          speed: 0.5,
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
    }[];
  }, [simulationActive, simulationPhase, simulationStages, layoutNodeMap, selectedNode, hoveredNode, hasLayout]);

  // Stage label position
  const stageLabelPosition = useMemo(() => {
    if (!simulationActive || selectedNode || hoveredNode || !hasLayout) return null;
    const stage = simulationStages[simulationPhase];
    if (stage.from === 'center') {
      return [0, 3, 0] as [number, number, number];
    }
    const sourceNode = layoutNodeMap[stage.from];
    if (!sourceNode) return null;
    return [sourceNode.position[0], sourceNode.position[1] + 3, sourceNode.position[2]] as [number, number, number];
  }, [simulationActive, simulationPhase, simulationStages, layoutNodeMap, selectedNode, hoveredNode, hasLayout]);

  if (!hasLayout) return null;

  return (
    <group>
      {/* ========== Selected node mode ========== */}
      {selectedNode &&
        selectedConnections.map((conn) => (
          <FlowLine
            key={conn.id}
            startPos={conn.startPos}
            endPos={conn.endPos}
            sourceVisual={conn.sourceVisual}
            targetVisual={conn.targetVisual}
            color={conn.color}
            speed={conn.speed}
            lineWidth={2}
            opacity={0.8}
          />
        ))}

      {/* ========== Simulation mode ========== */}
      {simulationActive && !selectedNode && !hoveredNode && (
        <>
          {simulationLines.map((line) => (
            <FlowLine
              key={line.id}
              startPos={line.startPos}
              endPos={line.endPos}
              sourceVisual={line.sourceVisual}
              targetVisual={line.targetVisual}
              color={line.color}
              speed={line.speed}
              lineWidth={1.5}
              opacity={0.6}
            />
          ))}

          {stageLabelPosition && (
            <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
              <Text
                position={stageLabelPosition}
                fontSize={0.8}
                color={simulationStages[simulationPhase].color}
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.1}
                outlineColor="#000000"
              >
                {simulationStages[simulationPhase].name}
              </Text>
            </Billboard>
          )}
        </>
      )}
    </group>
  );
}
