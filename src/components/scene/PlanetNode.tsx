'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Mesh, Group, Color, ShaderMaterial, AdditiveBlending, BackSide } from 'three';
import { Text, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import type { KnowledgeNode } from '@/types/knowledge';
import { useKnowledgeStore } from '@/stores/useKnowledgeStore';
import { getColorByType } from '@/utils/colors';
import { starSurfaceShader, planetSurfaceShader, atmosphereGlowShader } from '@/utils/shaders';

interface PlanetNodeProps {
  node: KnowledgeNode;
}

/** Deterministic hash from node id to decide rings, tilt, etc. */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function PlanetNode({ node }: PlanetNodeProps) {
  const groupRef = useRef<Group>(null);
  const planetRef = useRef<Mesh>(null);
  const coronaRef = useRef<Mesh>(null);
  const corona2Ref = useRef<Mesh>(null);
  const corona3Ref = useRef<Mesh>(null);
  const starMatRef = useRef<ShaderMaterial>(null);
  const planetMatRef = useRef<ShaderMaterial>(null);
  const { selectedNode, setSelectedNode, hoveredNode, setHoveredNode, connections } = useKnowledgeStore();

  const isSelected = selectedNode?.id === node.id;
  const isHovered = hoveredNode?.id === node.id;

  const isRelatedToSelected = useMemo(() => {
    if (!selectedNode) return false;
    if (isSelected) return true;
    return connections.some(conn =>
      (conn.source === selectedNode.id && conn.target === node.id) ||
      (conn.target === selectedNode.id && conn.source === node.id)
    );
  }, [selectedNode, node.id, connections, isSelected]);

  const isRelatedToHovered = useMemo(() => {
    if (!hoveredNode) return false;
    if (isHovered) return true;
    return connections.some(conn =>
      (conn.source === hoveredNode.id && conn.target === node.id) ||
      (conn.target === hoveredNode.id && conn.source === node.id)
    );
  }, [hoveredNode, node.id, connections, isHovered]);

  const isDimmed = useMemo(() => {
    if (selectedNode) return !isRelatedToSelected;
    if (hoveredNode) return !isRelatedToHovered;
    return false;
  }, [selectedNode, hoveredNode, isRelatedToSelected, isRelatedToHovered]);

  const colorScheme = getColorByType(node.type);

  const baseSize = useMemo(() => {
    if (node.type === 'category') return 1.8;
    if (node.type === 'adapter') return 1.4;
    return node.visual?.size || 0.8;
  }, [node.type, node.visual?.size]);

  const isCategory = node.type === 'category';
  const isAdapter = node.type === 'adapter';

  // Deterministic properties from node id
  const nodeHash = useMemo(() => hashCode(node.id), [node.id]);
  const hasRings = !isCategory && (nodeHash % 5 === 0); // ~20% get Saturn rings
  const ringTilt = useMemo(() => (nodeHash % 360) * (Math.PI / 180), [nodeHash]);

  const [clicked, setClicked] = useState(false);

  const clickSpring = useSpring({
    scale: clicked ? 1.4 : (isDimmed ? 0.8 : 1.0),
    config: { tension: 200, friction: 20 },
    onRest: () => setClicked(false),
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setClicked(true);
    setSelectedNode(isSelected ? null : node);
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHoveredNode(node);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHoveredNode(null);
    document.body.style.cursor = 'auto';
  };

  // Create shader uniforms
  const starUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new Color(colorScheme.primary) },
    uGlowColor: { value: new Color(colorScheme.glow) },
    uIntensity: { value: 2.0 },
  }), [colorScheme.primary, colorScheme.glow]);

  const planetUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new Color(colorScheme.primary) },
    uSecondaryColor: { value: new Color(colorScheme.secondary) },
    uIntensity: { value: 1.5 },
  }), [colorScheme.primary, colorScheme.secondary]);

  const atmosphereUniforms = useMemo(() => ({
    uColor: { value: new Color(colorScheme.primary) },
    uOpacity: { value: isCategory ? 0.4 : 0.25 },
    uFalloff: { value: 2.5 },
  }), [colorScheme.primary, isCategory]);

  // Dust particles for stars (category nodes)
  const dustPositions = useMemo(() => {
    if (!isCategory) return null;
    const count = 50;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = baseSize * 2 + Math.random() * baseSize;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * baseSize;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, [isCategory, baseSize]);

  // Animation
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Update shader time uniforms
    if (starMatRef.current) {
      starMatRef.current.uniforms.uTime.value = time;
      starMatRef.current.uniforms.uIntensity.value = isDimmed ? 0.5 : 2.0;
    }
    if (planetMatRef.current) {
      planetMatRef.current.uniforms.uTime.value = time;
      planetMatRef.current.uniforms.uIntensity.value = isDimmed ? 0.5 : 1.5;
    }

    // Gentle floating
    if (groupRef.current && !isSelected) {
      groupRef.current.position.y =
        node.position[1] + Math.sin(time * 0.5 + node.position[0]) * 0.05;
    }

    // Corona rings slow rotation
    if (coronaRef.current) coronaRef.current.rotation.z = time * 0.3;
    if (corona2Ref.current) corona2Ref.current.rotation.x = time * 0.2;
    if (corona3Ref.current) corona3Ref.current.rotation.y = time * -0.15;

    // Slow planet self-rotation
    if (planetRef.current && !isCategory) {
      planetRef.current.rotation.y = time * 0.1;
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      if (planetRef.current) {
        const mesh = planetRef.current;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    };
  }, []);

  return (
    <group ref={groupRef} position={node.position}>
      {isCategory ? (
        // ===== CATEGORY NODES → Realistic Stars =====
        <>
          {/* Inner core - procedural turbulent surface */}
          <animated.mesh
            ref={planetRef}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            scale={clickSpring.scale}
            castShadow
          >
            <sphereGeometry args={[baseSize, 48, 48]} />
            <shaderMaterial
              ref={starMatRef}
              vertexShader={starSurfaceShader.vertexShader}
              fragmentShader={starSurfaceShader.fragmentShader}
              uniforms={starUniforms}
            />
          </animated.mesh>

          {/* Corona halo - atmosphere glow */}
          <mesh>
            <sphereGeometry args={[baseSize * 1.4, 32, 32]} />
            <shaderMaterial
              vertexShader={atmosphereGlowShader.vertexShader}
              fragmentShader={atmosphereGlowShader.fragmentShader}
              uniforms={atmosphereUniforms}
              transparent
              side={BackSide}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Multi-ring corona: 3 torus rings at different tilts */}
          <mesh ref={coronaRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[baseSize * 1.6, 0.04, 16, 64]} />
            <meshStandardMaterial
              color={colorScheme.glow}
              emissive={colorScheme.glow}
              emissiveIntensity={isDimmed ? 0.2 : 1.5}
              transparent
              opacity={isDimmed ? 0.1 : 0.6}
            />
          </mesh>
          <mesh ref={corona2Ref} rotation={[0.8, 0.5, 0]}>
            <torusGeometry args={[baseSize * 1.8, 0.025, 16, 64]} />
            <meshStandardMaterial
              color={colorScheme.primary}
              emissive={colorScheme.primary}
              emissiveIntensity={isDimmed ? 0.1 : 1.0}
              transparent
              opacity={isDimmed ? 0.05 : 0.35}
            />
          </mesh>
          <mesh ref={corona3Ref} rotation={[1.2, -0.3, 0.6]}>
            <torusGeometry args={[baseSize * 2.0, 0.02, 16, 64]} />
            <meshStandardMaterial
              color={colorScheme.glow}
              emissive={colorScheme.glow}
              emissiveIntensity={isDimmed ? 0.05 : 0.6}
              transparent
              opacity={isDimmed ? 0.03 : 0.2}
            />
          </mesh>

          {/* Space dust orbiting the star */}
          {dustPositions && !isDimmed && (
            <points>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={dustPositions.length / 3}
                  array={dustPositions}
                  itemSize={3}
                />
              </bufferGeometry>
              <pointsMaterial
                color={colorScheme.glow}
                size={0.06}
                transparent
                opacity={0.5}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </points>
          )}

          {/* PointLight attached */}
          {!isDimmed && (
            <pointLight
              intensity={2.5}
              distance={12}
              color={colorScheme.primary}
            />
          )}
        </>
      ) : (
        // ===== RESOURCE / ADAPTER NODES → Realistic Planets =====
        <>
          {/* Planet body - procedural terrain */}
          <animated.mesh
            ref={planetRef}
            castShadow
            receiveShadow
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            scale={clickSpring.scale}
          >
            <sphereGeometry args={[isAdapter ? baseSize * 1.3 : baseSize, 32, 32]} />
            <shaderMaterial
              ref={planetMatRef}
              vertexShader={planetSurfaceShader.vertexShader}
              fragmentShader={planetSurfaceShader.fragmentShader}
              uniforms={planetUniforms}
              transparent
              opacity={isDimmed ? 0.15 : 1.0}
            />
          </animated.mesh>

          {/* Thick atmosphere glow */}
          <mesh>
            <sphereGeometry args={[(isAdapter ? baseSize * 1.3 : baseSize) * 1.25, 24, 24]} />
            <shaderMaterial
              vertexShader={atmosphereGlowShader.vertexShader}
              fragmentShader={atmosphereGlowShader.fragmentShader}
              uniforms={{
                uColor: { value: new Color(colorScheme.primary) },
                uOpacity: { value: isDimmed ? 0.03 : 0.15 },
                uFalloff: { value: 3.0 },
              }}
              transparent
              side={BackSide}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Adapter: double atmosphere layer */}
          {isAdapter && (
            <mesh>
              <sphereGeometry args={[baseSize * 1.3 * 1.4, 24, 24]} />
              <meshBasicMaterial
                color={colorScheme.glow}
                transparent
                opacity={isDimmed ? 0.01 : 0.06}
                side={BackSide}
                depthWrite={false}
              />
            </mesh>
          )}

          {/* Optional Saturn-style rings (~20% of planets) */}
          {hasRings && (
            <mesh rotation={[ringTilt, 0, 0.3]}>
              <torusGeometry args={[(isAdapter ? baseSize * 1.3 : baseSize) * 1.6, 0.15, 2, 64]} />
              <meshStandardMaterial
                color={colorScheme.secondary}
                emissive={colorScheme.glow}
                emissiveIntensity={isDimmed ? 0.05 : 0.3}
                transparent
                opacity={isDimmed ? 0.05 : 0.35}
                side={2} // DoubleSide
              />
            </mesh>
          )}
        </>
      )}

      {/* Selected effect - double rings */}
      {isSelected && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[baseSize * 1.5, 0.06, 16, 64]} />
            <meshStandardMaterial
              color="#00FFFF"
              emissive="#00FFFF"
              emissiveIntensity={1.5}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <torusGeometry args={[baseSize * 1.4, 0.04, 16, 64]} />
            <meshStandardMaterial
              color="#FF00FF"
              emissive="#FF00FF"
              emissiveIntensity={1.2}
              transparent
              opacity={0.8}
            />
          </mesh>
        </>
      )}

      {/* Text label */}
      {!isDimmed && (isHovered || isSelected || isCategory || isRelatedToSelected) && (
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <Text
            position={[0, baseSize + 1.2, 0]}
            fontSize={isCategory ? 0.7 : 0.6}
            color={isCategory ? '#00FFFF' : colorScheme.glow}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.1}
            outlineColor="#000000"
            maxWidth={10}
            textAlign="center"
          >
            {node.title.length > 20
              ? node.title.substring(0, 20) + '...'
              : node.title}
          </Text>
        </Billboard>
      )}

      {/* Type label when selected */}
      {isSelected && (
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <Text
            position={[0, baseSize + 0.6, 0]}
            fontSize={0.3}
            color="#00D9FF"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            [{node.type.toUpperCase()}]
          </Text>
        </Billboard>
      )}
    </group>
  );
}
