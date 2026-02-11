import { Raycaster, Vector2, Vector3, Plane } from 'three';
import type { Session } from '@/types/workspace';
import { SESSION_ZONE_RADIUS } from './workspaceLayout';

const raycaster = new Raycaster();
const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
const mouseNdc = new Vector2();
const hitPoint = new Vector3();

/**
 * 屏幕坐标 → Y=0 平面上的世界坐标
 */
export function screenToWorld(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  camera: THREE.Camera
): [number, number, number] | null {
  mouseNdc.set(
    ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
    -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1
  );

  raycaster.setFromCamera(mouseNdc, camera);
  const hit = raycaster.ray.intersectPlane(groundPlane, hitPoint);
  if (!hit) return null;

  return [hitPoint.x, hitPoint.y, hitPoint.z];
}

/**
 * 在给定世界坐标处找最近的 Session（在其半径内）
 */
export function findNearestSession(
  worldPos: [number, number, number],
  sessions: Session[]
): string | null {
  let closestId: string | null = null;
  let closestDist = Infinity;

  for (const s of sessions) {
    const dx = worldPos[0] - s.position[0];
    const dz = worldPos[2] - s.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist <= SESSION_ZONE_RADIUS && dist < closestDist) {
      closestDist = dist;
      closestId = s.id;
    }
  }

  return closestId;
}
