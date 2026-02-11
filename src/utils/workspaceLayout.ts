// Session 内模块布局算法

const TWO_PI = Math.PI * 2;

/**
 * 计算模块在 Session 区域内的位置
 * @param moduleCount 模块总数
 * @param index 当前模块索引
 * @param sessionCenter Session 中心坐标
 * @returns 模块世界坐标
 */
export function getModulePosition(
  moduleCount: number,
  index: number,
  sessionCenter: [number, number, number]
): [number, number, number] {
  const [cx, cy, cz] = sessionCenter;
  const y = cy + 0.8; // 模块悬浮在平台上方

  if (moduleCount === 1) {
    return [cx, y, cz];
  }

  if (moduleCount <= 6) {
    // 单环排列
    const radius = 5;
    const angle = (index / moduleCount) * TWO_PI - Math.PI / 2;
    return [
      cx + Math.cos(angle) * radius,
      y,
      cz + Math.sin(angle) * radius,
    ];
  }

  // 双环排列 (7-10+)
  const innerCount = Math.min(Math.ceil(moduleCount / 2), 5);
  const outerCount = moduleCount - innerCount;

  if (index < innerCount) {
    // 内环
    const radius = 4;
    const angle = (index / innerCount) * TWO_PI - Math.PI / 2;
    return [
      cx + Math.cos(angle) * radius,
      y,
      cz + Math.sin(angle) * radius,
    ];
  }

  // 外环
  const outerIndex = index - innerCount;
  const radius = 8;
  const angle = (outerIndex / outerCount) * TWO_PI - Math.PI / 2;
  return [
    cx + Math.cos(angle) * radius,
    y,
    cz + Math.sin(angle) * radius,
  ];
}

/**
 * Session 区域半径（用于 3D 渲染和碰撞检测）
 */
export const SESSION_ZONE_RADIUS = 12;

/**
 * 判断世界坐标是否在某个 Session 区域内
 */
export function isInsideSession(
  worldPos: [number, number, number],
  sessionCenter: [number, number, number]
): boolean {
  const dx = worldPos[0] - sessionCenter[0];
  const dz = worldPos[2] - sessionCenter[2];
  return Math.sqrt(dx * dx + dz * dz) <= SESSION_ZONE_RADIUS;
}
