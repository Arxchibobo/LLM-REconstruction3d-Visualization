'use client';

import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import { Vector3 } from 'three';

// Intro camera start/end positions
const INTRO_START = new Vector3(0, 60, 80);
const INTRO_END = new Vector3(0, 10, 20);
const INTRO_DURATION = 3.0; // seconds

// Reusable temp vectors (avoid GC)
const _nodePos = new Vector3();
const _camTarget = new Vector3();

export default function Camera() {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as any;
  const { selectedNode, cameraTarget, nodes } = useKnowledgeStore();

  // Intro state refs (avoid re-renders)
  const introCompleted = useRef(false);
  const introStarted = useRef(false);
  const introStartTime = useRef(0);

  // Selected node animation refs
  const focusAnimating = useRef(false);
  const focusStartTime = useRef(0);
  const focusStartPos = useRef(new Vector3());
  const focusTargetPos = useRef(new Vector3());
  const focusStartLookAt = useRef(new Vector3());
  const focusTargetLookAt = useRef(new Vector3());
  const lastSelectedId = useRef<string | null>(null);

  // Camera preset animation refs
  const presetAnimating = useRef(false);
  const presetStartTime = useRef(0);
  const presetStartPos = useRef(new Vector3());
  const presetTargetPos = useRef(new Vector3());
  const presetStartLookAt = useRef(new Vector3());
  const presetTargetLookAt = useRef(new Vector3());
  const lastCameraTarget = useRef<string | null>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // === Intro flythrough ===
    if (!introCompleted.current && nodes.length > 0) {
      if (!introStarted.current) {
        introStarted.current = true;
        introStartTime.current = time;
        camera.position.copy(INTRO_START);
      }

      const elapsed = time - introStartTime.current;
      const progress = Math.min(elapsed / INTRO_DURATION, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(INTRO_START, INTRO_END, eased);

      // Slight orbital sweep: rotate around Y by decaying angle
      const sweepAngle = (1 - eased) * 0.3;
      const xzDist = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
      if (xzDist > 0.1) {
        const currentAngle = Math.atan2(camera.position.x, camera.position.z);
        const newAngle = currentAngle + sweepAngle * 0.02;
        camera.position.x = Math.sin(newAngle) * xzDist;
        camera.position.z = Math.cos(newAngle) * xzDist;
      }

      camera.lookAt(0, 0, 0);
      if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
      }

      if (progress >= 1) {
        introCompleted.current = true;
      }
      return; // Don't process other animations during intro
    }

    // === Focus on selected node ===
    if (selectedNode && selectedNode.id !== lastSelectedId.current) {
      lastSelectedId.current = selectedNode.id;
      focusAnimating.current = true;
      focusStartTime.current = time;
      focusStartPos.current.copy(camera.position);

      // Save current lookAt target (from OrbitControls or origin)
      if (controls) {
        focusStartLookAt.current.copy(controls.target);
      } else {
        focusStartLookAt.current.set(0, 0, 0);
      }

      // Calculate target: camera positioned offset from node, looking at node
      _nodePos.set(...selectedNode.position);
      focusTargetLookAt.current.copy(_nodePos);

      // Camera offset: behind and above the node relative to current view direction
      const dirToNode = _nodePos.clone().sub(camera.position).normalize();
      const offset = dirToNode.multiplyScalar(-8); // 8 units back from node
      offset.y = Math.max(offset.y, 3); // Ensure camera is above
      focusTargetPos.current.copy(_nodePos.clone().add(new Vector3(offset.x, offset.y + 4, offset.z)));
    } else if (!selectedNode && lastSelectedId.current !== null) {
      // Deselected — animate back to overview
      lastSelectedId.current = null;
      focusAnimating.current = true;
      focusStartTime.current = time;
      focusStartPos.current.copy(camera.position);
      focusTargetPos.current.set(0, 10, 20);
      if (controls) {
        focusStartLookAt.current.copy(controls.target);
      } else {
        focusStartLookAt.current.set(0, 0, 0);
      }
      focusTargetLookAt.current.set(0, 0, 0);
    }

    if (focusAnimating.current) {
      const elapsed = time - focusStartTime.current;
      const duration = 1.2;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(focusStartPos.current, focusTargetPos.current, eased);

      // Animate OrbitControls target to the node position
      if (controls) {
        _camTarget.lerpVectors(focusStartLookAt.current, focusTargetLookAt.current, eased);
        controls.target.copy(_camTarget);
        controls.update();
      }

      if (progress >= 1) {
        focusAnimating.current = false;
      }
    }

    // === Camera presets ===
    if (cameraTarget && cameraTarget !== lastCameraTarget.current) {
      lastCameraTarget.current = cameraTarget;
      const positions: { [key: string]: [number, number, number] } = {
        home: [0, 20, 40],
        top: [0, 50, 0.1],
        side: [50, 10, 0],
        front: [0, 10, 50],
      };

      const targetPos = positions[cameraTarget];
      if (targetPos) {
        presetAnimating.current = true;
        presetStartTime.current = time;
        presetStartPos.current.copy(camera.position);
        presetTargetPos.current.set(...targetPos);
        if (controls) {
          presetStartLookAt.current.copy(controls.target);
        } else {
          presetStartLookAt.current.set(0, 0, 0);
        }
        presetTargetLookAt.current.set(0, 0, 0);
      }
    } else if (!cameraTarget && lastCameraTarget.current !== null) {
      lastCameraTarget.current = null;
    }

    if (presetAnimating.current) {
      const elapsed = time - presetStartTime.current;
      const progress = Math.min(elapsed / 1.0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(presetStartPos.current, presetTargetPos.current, eased);

      if (controls) {
        _camTarget.lerpVectors(presetStartLookAt.current, presetTargetLookAt.current, eased);
        controls.target.copy(_camTarget);
        controls.update();
      }

      if (progress >= 1) {
        presetAnimating.current = false;
      }
    }
  });

  return null;
}
