'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CYBERPUNK_LAYER_COLORS } from '@/utils/colors';

/**
 * 赛博朋克风格网格地板
 * 特性：
 * - 霓虹青色网格线
 * - 轻微脉动动画
 * - 半透明效果
 */
export default function GridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null);

  // 脉动动画
  useFrame((state) => {
    if (gridRef.current) {
      const time = state.clock.elapsedTime;
      // 轻微的透明度脉动（0.1 ~ 0.3）
      const opacity = 0.2 + Math.sin(time * 0.5) * 0.1;

      if (gridRef.current.material instanceof THREE.Material) {
        gridRef.current.material.opacity = opacity;
      }
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[
        100,                                      // 网格大小
        50,                                       // 分割数
        CYBERPUNK_LAYER_COLORS.coreLayer.primary,    // 中心线颜色（青色）
        CYBERPUNK_LAYER_COLORS.background.accent     // 网格线颜色（深灰）
      ]}
      position={[0, -15, 0]}  // 放置在场景底部
      rotation={[0, 0, 0]}
      material-transparent={true}
      material-opacity={0.2}
    />
  );
}
