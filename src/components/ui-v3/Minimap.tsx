'use client';

import { useRef, useEffect } from 'react';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import { getColorByType } from '@/utils/colors';

const MAP_SIZE = 160;
const PADDING = 10;

/**
 * Minimap - Top-down (X-Z plane) projection of all nodes
 * Positioned bottom-left above the status bar
 */
export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { layoutNodeMap, selectedNode, hoveredNode } = useKnowledgeStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes = Object.values(layoutNodeMap);
    if (nodes.length === 0) return;

    // Calculate bounds (X-Z plane)
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    nodes.forEach(node => {
      const [x, , z] = node.position;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    });

    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;
    const range = Math.max(rangeX, rangeZ);

    const drawSize = MAP_SIZE - PADDING * 2;

    // Map world coords to canvas coords
    const toCanvas = (worldX: number, worldZ: number): [number, number] => {
      const cx = PADDING + ((worldX - minX) / range) * drawSize;
      const cy = PADDING + ((worldZ - minZ) / range) * drawSize;
      return [cx, cy];
    };

    // Clear
    ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);

    // Background
    ctx.fillStyle = 'rgba(10, 25, 41, 0.85)';
    ctx.beginPath();
    ctx.roundRect(0, 0, MAP_SIZE, MAP_SIZE, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0, 0, MAP_SIZE, MAP_SIZE, 8);
    ctx.stroke();

    // Orbital guide rings at radii 8, 15, 25
    const centerCanvas = toCanvas(0, 0);
    [8, 15, 25].forEach(radius => {
      const screenRadius = (radius / range) * drawSize;
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(centerCanvas[0], centerCanvas[1], screenRadius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(node => {
      const [x, , z] = node.position;
      const [cx, cy] = toCanvas(x, z);

      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;

      // Node dot
      const colorScheme = getColorByType(node.type);
      const dotRadius = isSelected ? 4 : (isHovered ? 3 : (node.type === 'category' ? 2.5 : 1.5));

      ctx.fillStyle = isSelected ? '#FFFFFF' : colorScheme.primary;
      ctx.globalAlpha = isSelected || isHovered ? 1.0 : 0.7;
      ctx.beginPath();
      ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
      ctx.fill();

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1.0;

    // Center indicator
    const [ccx, ccy] = toCanvas(0, 0);
    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.arc(ccx, ccy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ccx - 5, ccy);
    ctx.lineTo(ccx + 5, ccy);
    ctx.moveTo(ccx, ccy - 5);
    ctx.lineTo(ccx, ccy + 5);
    ctx.stroke();

  }, [layoutNodeMap, selectedNode, hoveredNode]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_SIZE}
      height={MAP_SIZE}
      className="fixed bottom-14 left-4 z-40 pointer-events-none"
      style={{ imageRendering: 'auto' }}
    />
  );
}
