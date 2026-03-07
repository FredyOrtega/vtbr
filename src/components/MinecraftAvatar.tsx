import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MinecraftAvatarProps {
  analyser: AnalyserNode | null;
}

export function MinecraftAvatar({ analyser }: MinecraftAvatarProps) {
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  
  // Audio data buffer
  const dataArray = useRef(new Uint8Array(analyser?.frequencyBinCount || 256));

  // Materials
  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffccaa' }), []);
  const shirtMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#00aaaa' }), []); // Cyan shirt (Steve)
  const pantsMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3333aa' }), []); // Blue pants
  const eyeMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 'white' }), []);
  const pupilMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3333aa' }), []);
  const mouthMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#330000' }), []);
  const hairMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#332211' }), []);

  // Helper function
  const getAverageVolume = (array: Uint8Array, start: number, end: number) => {
    let values = 0;
    for (let i = start; i <= end; i++) values += array[i];
    return values / (end - start + 1);
  };

  useFrame((state, delta) => {
    // --- Lip Sync Logic ---
    let mouthOpenTarget = 0;

    if (analyser) {
      if (dataArray.current.length !== analyser.frequencyBinCount) {
        dataArray.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataArray.current);

      // Calculate intensity (0-255)
      const volume = getAverageVolume(dataArray.current, 0, 15);
      // Normalize to 0-1 range
      mouthOpenTarget = volume / 255;
      // Boost signal
      mouthOpenTarget = Math.min(1, mouthOpenTarget * 3.0);
    }

    // Animate Mouth
    if (mouthRef.current) {
      // Smooth interpolation
      const currentScaleY = mouthRef.current.scale.y;
      const targetScaleY = 0.1 + (mouthOpenTarget * 0.8); // Min 0.1, Max 0.9
      
      mouthRef.current.scale.y = THREE.MathUtils.lerp(currentScaleY, targetScaleY, 0.2);
    }

    // Idle Animation (Breathing / Arm swing)
    const time = state.clock.getElapsedTime();
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(time * 2) * 0.1;
      rightArmRef.current.rotation.x = -Math.sin(time * 2) * 0.1;
    }
  });

  const pixelScale = 0.125; // 1 unit = 8 pixels

  return (
    <group position={[0, -1, 0]} scale={1.5}>
      {/* HEAD Group */}
      <group position={[0, 1.5, 0]}>
        {/* Main Head Box */}
        <mesh material={skinMaterial} position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
        
        {/* Hair (Top) */}
        <mesh material={hairMaterial} position={[0, 0.51, 0]}>
          <boxGeometry args={[1.05, 0.2, 1.05]} />
        </mesh>
        {/* Hair (Back) */}
        <mesh material={hairMaterial} position={[0, 0, -0.51]}>
          <boxGeometry args={[1.05, 1, 0.1]} />
        </mesh>
        {/* Hair (Sides) */}
        <mesh material={hairMaterial} position={[0.51, 0, 0]}>
          <boxGeometry args={[0.1, 1, 1.05]} />
        </mesh>
        <mesh material={hairMaterial} position={[-0.51, 0, 0]}>
          <boxGeometry args={[0.1, 1, 1.05]} />
        </mesh>

        {/* Eyes */}
        <group position={[0, 0.1, 0.51]}>
          {/* Left Eye */}
          <mesh material={eyeMaterial} position={[-0.25, 0, 0]}>
            <planeGeometry args={[0.25, 0.125]} />
          </mesh>
          <mesh material={pupilMaterial} position={[-0.18, 0, 0.001]}>
            <planeGeometry args={[0.125, 0.125]} />
          </mesh>

          {/* Right Eye */}
          <mesh material={eyeMaterial} position={[0.25, 0, 0]}>
            <planeGeometry args={[0.25, 0.125]} />
          </mesh>
          <mesh material={pupilMaterial} position={[0.18, 0, 0.001]}>
            <planeGeometry args={[0.125, 0.125]} />
          </mesh>
        </group>

        {/* Mouth */}
        <mesh 
          ref={mouthRef}
          material={mouthMaterial} 
          position={[0, -0.25, 0.51]}
        >
          {/* Initial size, will be scaled by audio */}
          <planeGeometry args={[0.5, 0.25]} />
        </mesh>
      </group>

      {/* BODY */}
      <mesh material={shirtMaterial} position={[0, 0.75, 0]}>
        <boxGeometry args={[1, 1.5, 0.5]} />
      </mesh>

      {/* ARMS */}
      <group position={[-0.75, 1.25, 0]} ref={leftArmRef}>
        <mesh material={shirtMaterial} position={[0, -0.75, 0]}>
          <boxGeometry args={[0.5, 1.5, 0.5]} />
        </mesh>
      </group>
      <group position={[0.75, 1.25, 0]} ref={rightArmRef}>
        <mesh material={shirtMaterial} position={[0, -0.75, 0]}>
          <boxGeometry args={[0.5, 1.5, 0.5]} />
        </mesh>
      </group>

      {/* LEGS */}
      <mesh material={pantsMaterial} position={[-0.25, -0.75, 0]}>
        <boxGeometry args={[0.5, 1.5, 0.5]} />
      </mesh>
      <mesh material={pantsMaterial} position={[0.25, -0.75, 0]}>
        <boxGeometry args={[0.5, 1.5, 0.5]} />
      </mesh>
    </group>
  );
}
