'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import { useActivityStore } from '@/stores/useActivityStore';

interface PulseRing {
  id: string;
  position: [number, number, number];
  color: string;
  birthTime: number;
  duration: number;
}

/**
 * Live activity overlay - shows expanding pulse rings on nodes
 * when Claude Code is actively working.
 */
export default function LiveActivityOverlay() {
  const { nodes } = useKnowledgeStore();
  const { events, connect } = useActivityStore();
  const [rings, setRings] = useState<PulseRing[]>([]);
  const processedEvents = useRef(new Set<string>());

  // Connect to activity stream on mount
  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  // Process new events into pulse rings
  useEffect(() => {
    if (events.length === 0) return;

    const newRings: PulseRing[] = [];
    const now = performance.now() / 1000;

    for (const event of events) {
      if (processedEvents.current.has(event.id)) continue;
      if (Date.now() - event.timestamp > 5000) continue;

      processedEvents.current.add(event.id);

      // Find matching category node
      const categoryId = `category-${event.nodeType}s`;
      const categoryNode = nodes.find((n) => n.id === categoryId);
      // Find matching resource nodes
      const matchingNodes = nodes.filter((n) => n.type === event.nodeType).slice(0, 2);
      const targets = categoryNode ? [categoryNode, ...matchingNodes] : matchingNodes;

      for (const target of targets) {
        newRings.push({
          id: `ring-${event.id}-${target.id}`,
          position: target.position,
          color: event.color,
          birthTime: now,
          duration: 2.5,
        });
      }
    }

    if (newRings.length > 0) {
      setRings((prev) => [...prev, ...newRings].slice(-30));
    }
  }, [events, nodes]);

  // Periodically clean expired rings
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now() / 1000;
      setRings((prev) => {
        const alive = prev.filter((r) => now - r.birthTime < r.duration);
        return alive.length !== prev.length ? alive : prev;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Periodically prune processed events set
  useEffect(() => {
    const interval = setInterval(() => {
      if (processedEvents.current.size > 200) {
        processedEvents.current.clear();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <group>
      {rings.map((ring) => (
        <PulseRingMesh key={ring.id} ring={ring} />
      ))}
    </group>
  );
}

function PulseRingMesh({ ring }: { ring: PulseRing }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return;

    const now = performance.now() / 1000;
    const elapsed = now - ring.birthTime;
    const progress = Math.min(elapsed / ring.duration, 1);

    // Expand outward
    const scale = 1 + progress * 4;
    meshRef.current.scale.set(scale, 1, scale);

    // Fade out with easing
    materialRef.current.opacity = Math.max(0, (1 - progress * progress) * 0.5);

    // Hide when expired
    meshRef.current.visible = progress < 1;
  });

  return (
    <mesh ref={meshRef} position={ring.position} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.6, 0.8, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        color={ring.color}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
