'use client';

/**
 * InstancedPlanetNodes - Two instancedMesh draw calls for all resource nodes
 * 1. Planet bodies: sphereGeometry with standard material
 * 2. Atmospheres: slightly larger sphereGeometry with BackSide material
 * Supports raycasting via onClick + event.instanceId for hover/click
 */

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { InstancedMesh, Object3D, Color, BackSide } from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import type { KnowledgeNode } from '@/types/knowledge';
import { getColorByType } from '@/utils/colors';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';

interface InstancedPlanetNodesProps {
  nodes: KnowledgeNode[];
  enableAnimations?: boolean;
}

const tempObject = new Object3D();
const tempColor = new Color();

export default function InstancedPlanetNodes({ nodes, enableAnimations = true }: InstancedPlanetNodesProps) {
  const planetRef = useRef<InstancedMesh>(null);
  const atmosphereRef = useRef<InstancedMesh>(null);
  const { hoveredNode, selectedNode, setSelectedNode, setHoveredNode, connections } = useKnowledgeStore();

  // Build index map: instanceId → node
  const nodeIndexMap = useMemo(() => {
    const map = new Map<number, KnowledgeNode>();
    nodes.forEach((node, index) => {
      map.set(index, node);
    });
    return map;
  }, [nodes]);

  // Determine which nodes are "related" to selection
  const relatedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const ids = new Set<string>();
    ids.add(selectedNode.id);
    connections.forEach(conn => {
      if (conn.source === selectedNode.id) ids.add(conn.target);
      if (conn.target === selectedNode.id) ids.add(conn.source);
    });
    return ids;
  }, [selectedNode, connections]);

  // Update instance transforms & colors
  useEffect(() => {
    if (!planetRef.current) return;

    nodes.forEach((node, index) => {
      const isHovered = node.id === hoveredNode?.id;
      const isSelected = node.id === selectedNode?.id;
      const isAdapter = node.type === 'adapter';
      const baseSize = node.visual?.size || 0.8;
      const effectiveSize = isAdapter ? baseSize * 1.2 : baseSize;
      const scale = (isHovered || isSelected) ? effectiveSize * 1.25 : effectiveSize;

      // Planet body
      tempObject.position.set(...node.position);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      planetRef.current!.setMatrixAt(index, tempObject.matrix);

      // Atmosphere (slightly larger)
      if (atmosphereRef.current) {
        tempObject.scale.setScalar(scale * 1.25);
        tempObject.updateMatrix();
        atmosphereRef.current.setMatrixAt(index, tempObject.matrix);
      }

      // Color for planet body
      const colorScheme = getColorByType(node.type);
      const isDimmed = selectedNode && !relatedNodeIds.has(node.id);

      tempColor.set(colorScheme.primary);
      if (isDimmed) {
        tempColor.multiplyScalar(0.15);
      } else if (isHovered || isSelected) {
        tempColor.multiplyScalar(1.3);
      } else {
        tempColor.multiplyScalar(1.0);
      }
      planetRef.current!.setColorAt(index, tempColor);

      // Color for atmosphere
      if (atmosphereRef.current) {
        tempColor.set(colorScheme.primary);
        if (isDimmed) {
          tempColor.multiplyScalar(0.02);
        } else {
          tempColor.multiplyScalar(0.4);
        }
        atmosphereRef.current.setColorAt(index, tempColor);
      }
    });

    planetRef.current.instanceMatrix.needsUpdate = true;
    if (planetRef.current.instanceColor) {
      planetRef.current.instanceColor.needsUpdate = true;
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.instanceMatrix.needsUpdate = true;
      if (atmosphereRef.current.instanceColor) {
        atmosphereRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [nodes, hoveredNode, selectedNode, relatedNodeIds]);

  // Floating animation
  useFrame((state) => {
    if (!planetRef.current || !enableAnimations) return;

    const time = state.clock.elapsedTime;

    nodes.forEach((node, index) => {
      const isSelected = node.id === selectedNode?.id;
      if (isSelected) return;

      const isAdapter = node.type === 'adapter';
      const baseSize = node.visual?.size || 0.8;
      const effectiveSize = isAdapter ? baseSize * 1.2 : baseSize;

      tempObject.position.set(
        node.position[0],
        node.position[1] + Math.sin(time * 0.5 + node.position[0]) * 0.05,
        node.position[2]
      );
      tempObject.scale.setScalar(effectiveSize);
      tempObject.updateMatrix();

      planetRef.current!.setMatrixAt(index, tempObject.matrix);

      // Update atmosphere position too
      if (atmosphereRef.current) {
        tempObject.scale.setScalar(effectiveSize * 1.25);
        tempObject.updateMatrix();
        atmosphereRef.current.setMatrixAt(index, tempObject.matrix);
      }
    });

    planetRef.current.instanceMatrix.needsUpdate = true;
    if (atmosphereRef.current) {
      atmosphereRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  // Click handler via instanceId
  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const instanceId = event.instanceId;
    if (instanceId === undefined) return;
    const node = nodeIndexMap.get(instanceId);
    if (node) {
      const isAlreadySelected = selectedNode?.id === node.id;
      setSelectedNode(isAlreadySelected ? null : node);
    }
  }, [nodeIndexMap, selectedNode, setSelectedNode]);

  // Hover handler
  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const instanceId = event.instanceId;
    if (instanceId === undefined) return;
    const node = nodeIndexMap.get(instanceId);
    if (node) {
      setHoveredNode(node);
      document.body.style.cursor = 'pointer';
    }
  }, [nodeIndexMap, setHoveredNode]);

  const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHoveredNode(null);
    document.body.style.cursor = 'auto';
  }, [setHoveredNode]);

  if (nodes.length === 0) return null;

  return (
    <>
      {/* Planet bodies - single sphere instancedMesh */}
      <instancedMesh
        ref={planetRef}
        args={[undefined, undefined, nodes.length]}
        frustumCulled={false}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          roughness={0.4}
          metalness={0.2}
          emissive="#222244"
          emissiveIntensity={0.2}
          transparent
          opacity={0.9}
        />
      </instancedMesh>

      {/* Atmospheres - BackSide rendering for glow effect */}
      <instancedMesh
        ref={atmosphereRef}
        args={[undefined, undefined, nodes.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          transparent
          opacity={0.12}
          side={BackSide}
          depthWrite={false}
        />
      </instancedMesh>
    </>
  );
}
