'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';

/**
 * 相机控制器 - 响应 UI 状态变化
 * 功能：缩放控制、重置视图
 */
export default function CameraController() {
  const { camera } = useThree();
  const { cameraZoom, cameraReset } = useKnowledgeStore();
  const initialPosition = useRef([0, 10, 20]); // 初始相机位置
  const initialZoom = useRef(100); // 初始缩放级别

  // 缩放控制（通过调整相机距离）
  useEffect(() => {
    if (!camera) return;

    // 计算缩放比例（100% = 1.0，200% = 0.5，10% = 10）
    const zoomFactor = initialZoom.current / cameraZoom;

    // 获取当前相机位置
    const currentPosition = camera.position.clone();
    const distance = currentPosition.length();

    // 计算新的距离
    const baseDistance = Math.sqrt(
      initialPosition.current[0] ** 2 +
      initialPosition.current[1] ** 2 +
      initialPosition.current[2] ** 2
    );
    const newDistance = baseDistance * zoomFactor;

    // 保持方向，只改变距离
    const direction = currentPosition.normalize();
    camera.position.copy(direction.multiplyScalar(newDistance));

    camera.updateProjectionMatrix();
  }, [camera, cameraZoom]);

  // 重置视图
  useEffect(() => {
    if (!cameraReset || !camera) return;

    // 重置相机位置
    camera.position.set(
      initialPosition.current[0],
      initialPosition.current[1],
      initialPosition.current[2]
    );

    // 重置相机朝向
    camera.lookAt(0, 0, 0);

    camera.updateProjectionMatrix();

    // 重置标志（通过修改 store 的内部状态）
    setTimeout(() => {
      useKnowledgeStore.setState({ cameraReset: false });
    }, 100);
  }, [camera, cameraReset]);

  return null; // 不渲染任何内容
}
