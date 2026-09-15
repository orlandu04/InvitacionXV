import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

import { getPerformanceLevel } from '../../hooks/usePerformance'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { seededRandom } from '../../utils/random'

const COUNTS: Record<string, number> = { high: 230, medium: 140, low: 64 }

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aMix;
  varying float vMix;
  varying float vTwinkle;

  void main() {
    vMix = aMix;
    vec3 p = position;
    // Deriva ascendente envolvente + vaivén horizontal orgánico
    p.y = mod(p.y + uTime * aSpeed * 0.14 + 5.0, 10.0) - 5.0;
    p.x += sin(uTime * aSpeed * 0.22 + aPhase * 6.2831) * 0.42;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uPixelRatio * 30.0 / max(0.1, -mv.z);

    vTwinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSpeed * 0.9) + aPhase * 6.2831);
  }
`

const FRAGMENT = /* glsl */ `
  varying float vMix;
  varying float vTwinkle;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float alpha = pow(smoothstep(0.5, 0.0, d), 2.1);
    vec3 gold = vec3(0.831, 0.686, 0.216);
    vec3 blushWhite = vec3(1.0, 0.93, 0.97);
    vec3 color = mix(gold, blushWhite, vMix);
    gl_FragColor = vec4(color, alpha * vTwinkle);
  }
`

interface DustFieldResources {
  geometry: THREE.BufferGeometry
  material: THREE.ShaderMaterial
}

function createDustField(count: number): DustFieldResources {
  const rnd = seededRandom(2027)

  const positions = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const phases = new Float32Array(count)
  const speeds = new Float32Array(count)
  const mixes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rnd() - 0.5) * 14
    positions[i * 3 + 1] = (rnd() - 0.5) * 10
    positions[i * 3 + 2] = -4 + rnd() * 6
    scales[i] = 0.45 + rnd() * 1.75
    phases[i] = rnd()
    speeds[i] = 0.35 + rnd() * 1.4
    mixes[i] = rnd() * rnd() // más dorado que blanco
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
  geometry.setAttribute('aMix', new THREE.BufferAttribute(mixes, 1))

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
    },
  })

  return { geometry, material }
}

function DustField(): React.JSX.Element {
  const level = getPerformanceLevel()
  const reducedMotion = useReducedMotion()
  const count = COUNTS[level] ?? 120
  const dpr = useThree((state) => state.viewport.dpr)
  const [{ geometry, material }] = useState<DustFieldResources>(() => createDustField(count))
  const groupRef = useRef<THREE.Group>(null)

  /* Sincroniza DPR + limpieza al desmontar (mutación intencional de three.js) */
  useEffect(() => {
    // oxlint-disable-next-line immutability
    material.uniforms.uPixelRatio.value = dpr
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [dpr, geometry, material])

  useFrame((state) => {
    if (document.hidden) return
    // oxlint-disable-next-line immutability
    material.uniforms.uTime.value = state.clock.elapsedTime
    if (!reducedMotion && groupRef.current) {
      const targetX = state.pointer.y * 0.05
      const targetY = state.pointer.x * 0.07
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.03
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <primitive object={material} attach="material" />
      </points>
    </group>
  )
}

/**
 * Polvo dorado cinematográfico — Three.js con presupuesto de rendimiento.
 * Se carga de forma diferida SOLO después de abrir la invitación.
 */
export default function Particles(): React.JSX.Element {
  const level = getPerformanceLevel()

  return (
    <div className="pointer-events-none fixed inset-0 z-[2]" aria-hidden="true">
      <Canvas
        dpr={[1, level === 'high' ? 1.8 : 1.4]}
        camera={{ fov: 55, position: [0, 0, 7] }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        resize={{ scroll: false }}
      >
        <DustField />
      </Canvas>
    </div>
  )
}
