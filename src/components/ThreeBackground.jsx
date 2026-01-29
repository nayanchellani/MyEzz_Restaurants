import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Floating particles animation - minimal and performant
function FloatingParticles({ count = 50 }) {
  const mesh = useRef();
  
  // Generate random particle positions
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Spread particles across the scene
      positions[i * 3] = (Math.random() - 0.5) * 20;      // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;  // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;  // z
      
      // Random sizes for variety
      sizes[i] = Math.random() * 0.5 + 0.1;
    }
    
    return { positions, sizes };
  }, [count]);

  // Animate particles - gentle floating motion
  useFrame((state) => {
    if (mesh.current) {
      const time = state.clock.elapsedTime * 0.2;
      mesh.current.rotation.y = time * 0.1;
      mesh.current.rotation.x = Math.sin(time * 0.5) * 0.1;
      
      // Subtle position animation
      const positions = mesh.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(time + i * 0.5) * 0.002;
      }
      mesh.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#FF6600"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Subtle glowing orbs that float
function GlowingOrbs({ count = 8 }) {
  const groupRef = useRef();
  
  const orbs = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5 - 3,
      ],
      scale: Math.random() * 0.3 + 0.1,
      speed: Math.random() * 0.5 + 0.2,
    }));
  }, [count]);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.children.forEach((orb, i) => {
        const data = orbs[i];
        orb.position.y = data.position[1] + Math.sin(time * data.speed + i) * 0.5;
        orb.position.x = data.position[0] + Math.cos(time * data.speed * 0.5 + i) * 0.3;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.position}>
          <sphereGeometry args={[orb.scale, 16, 16]} />
          <meshBasicMaterial
            color="#FF6600"
            transparent
            opacity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main Three.js background component
export default function ThreeBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
        gl={{ 
          antialias: false, // Disable for performance
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <ambientLight intensity={0.5} />
        <FloatingParticles count={40} />
        <GlowingOrbs count={6} />
      </Canvas>
    </div>
  );
}
