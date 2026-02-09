/**
 * Procedural GLSL shaders for realistic celestial visuals.
 * No external textures needed - all generated mathematically.
 */

// ============================================================
// Shared GLSL noise functions (simplex 3D)
// ============================================================
const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
`;

// ============================================================
// Star Surface Shader (for category nodes - glowing suns)
// ============================================================
export const starSurfaceShader = {
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    ${NOISE_GLSL}

    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uGlowColor;
    uniform float uIntensity;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      // Roiling surface turbulence
      vec3 noiseCoord = vPosition * 1.5 + uTime * 0.15;
      float turbulence = fbm(noiseCoord, 5);
      float turbulence2 = fbm(noiseCoord * 2.0 + 10.0, 3);

      // Color variation: core bright → edge darker with glow color
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

      vec3 coreColor = uColor * (1.0 + turbulence * 0.4);
      vec3 edgeColor = uGlowColor * (0.8 + turbulence2 * 0.25);
      vec3 surfaceColor = mix(coreColor, edgeColor, fresnel * 0.6);

      // Bright spots (solar flares)
      float flare = smoothstep(0.3, 0.8, turbulence2);
      surfaceColor += uGlowColor * flare * 0.3;

      // Emissive intensity
      surfaceColor *= uIntensity;

      gl_FragColor = vec4(surfaceColor, 1.0);
    }
  `,
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: null }, // set per-node
    uGlowColor: { value: null },
    uIntensity: { value: 2.0 },
  },
};

// ============================================================
// Planet Surface Shader (for resource nodes)
// ============================================================
export const planetSurfaceShader = {
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    ${NOISE_GLSL}

    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uSecondaryColor;
    uniform float uIntensity;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      // Multi-octave noise for terrain-like surface
      vec3 noiseCoord = vPosition * 2.0 + uTime * 0.03;
      float terrain = fbm(noiseCoord, 4);

      // Color banding based on noise height (continental feel)
      float band = smoothstep(-0.3, 0.3, terrain);
      vec3 lowColor = uColor * 0.6;
      vec3 highColor = uSecondaryColor * 0.9;
      vec3 surfaceColor = mix(lowColor, highColor, band);

      // Add subtle detail noise
      float detail = snoise(vPosition * 8.0 + uTime * 0.05) * 0.08;
      surfaceColor += detail;

      // Atmosphere shimmer at edges (Fresnel)
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
      vec3 atmosphereColor = uColor * 1.0;
      surfaceColor = mix(surfaceColor, atmosphereColor, fresnel * 0.3);

      // Basic lighting
      vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
      float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.5 + 0.5;
      surfaceColor *= diffuse * uIntensity;

      gl_FragColor = vec4(surfaceColor, 1.0);
    }
  `,
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: null },
    uSecondaryColor: { value: null },
    uIntensity: { value: 1.5 },
  },
};

// ============================================================
// Atmosphere Glow Shader (for halos around nodes)
// ============================================================
export const atmosphereGlowShader = {
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uFalloff;

    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      // Fresnel-based alpha: transparent at face, opaque at edges
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), uFalloff);

      gl_FragColor = vec4(uColor, fresnel * uOpacity);
    }
  `,
  uniforms: {
    uColor: { value: null },
    uOpacity: { value: 0.5 },
    uFalloff: { value: 2.5 },
  },
};
