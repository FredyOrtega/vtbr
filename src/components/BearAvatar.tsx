import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface BearAvatarProps {
  analyser: AnalyserNode | null;
  headTransform: {
    rotation: { x: number, y: number, z: number };
    position: { x: number, y: number };
    expressions: { browLeft: number; browRight: number };
  };
}

export function BearAvatar({ analyser, headTransform }: BearAvatarProps) {
  const mouthRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftEyebrowRef = useRef<THREE.Mesh>(null);
  const rightEyebrowRef = useRef<THREE.Mesh>(null);
  const leftEarRef = useRef<THREE.Mesh>(null);
  const rightEarRef = useRef<THREE.Mesh>(null);
  
  // Blink state
  const nextBlinkTime = useRef(0);
  const isBlinking = useRef(false);
  const eyeScale = useRef(1);
  
  // Audio data buffer
  const dataArray = useRef(new Uint8Array(analyser?.frequencyBinCount || 256));

  // Materials
  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#E0AC69', roughness: 0.5 }), []); // Roblox Skin Tone
  const metalMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#A0A0A0', roughness: 0.3, metalness: 0.9 }), []); // Silver Metal
  const darkMetalMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#333333', roughness: 0.4, metalness: 0.8 }), []); // Dark Metal
  const circuitMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.2, metalness: 0.5, emissive: '#00FF00', emissiveIntensity: 0.2 }), []); // Circuitry
  const glowingEyeMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#00FFFF', emissive: '#00FFFF', emissiveIntensity: 2.0 }), []); // Cyan Glowing Eye
  const eyeMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.2 }), []); // Black Eye
  
  // Clothing Materials
  const shirtMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1A1A1A', roughness: 0.6 }), []); // Black Oversized Shirt
  const pantsMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.6 }), []); // Dark Grey Baggy Pants
  const capMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8B0000', roughness: 0.5 }), []); // Dark Red Cap
  const shoeMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.3 }), []); // White Shoes
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FFD700', roughness: 0.2, metalness: 0.8 }), []); // Gold

  // Helper function
  const getAverageVolume = (array: Uint8Array, start: number, end: number) => {
    let values = 0;
    for (let i = start; i <= end; i++) values += array[i];
    return values / (end - start + 1);
  };

  useFrame((state, delta) => {
    // ... (Lip Sync & Animation Logic remains the same) ...
    // --- Lip Sync & Voice Activity Detection (VAD) ---
    let mouthOpenTarget = 0;
    let mouthWidthTarget = 1;
    let isSpeaking = false;

    if (analyser) {
      if (dataArray.current.length !== analyser.frequencyBinCount) {
        dataArray.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataArray.current);

      const voiceVolume = getAverageVolume(dataArray.current, 4, 12);
      const voiceThreshold = 5; 

      if (voiceVolume > voiceThreshold) {
        isSpeaking = true;
        let normalizedVol = (voiceVolume - voiceThreshold) / (255 - voiceThreshold);
        mouthOpenTarget = Math.min(1, normalizedVol * 6.0);

        const lowFreq = getAverageVolume(dataArray.current, 2, 6);
        const highFreq = getAverageVolume(dataArray.current, 20, 50);
        
        if (lowFreq > highFreq * 1.3) {
           mouthWidthTarget = 0.6; 
        } else {
           mouthWidthTarget = 1.0 + (normalizedVol * 0.4);
        }
      } else {
        mouthOpenTarget = 0;
        mouthWidthTarget = 1;
        isSpeaking = false;
      }
    }

    // Animate Mouth (Simple Plane for Roblox style)
    if (mouthRef.current) {
      const targetScaleY = 0.2 + (mouthOpenTarget * 0.8); 
      const smoothFactor = isSpeaking ? 25 * delta : 15 * delta;
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetScaleY, smoothFactor);
      mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, mouthWidthTarget, smoothFactor * 0.8);
    }

    // --- Eyebrow Animation ---
    if (leftEyebrowRef.current && rightEyebrowRef.current) {
        const baseY = 0.25;
        let browOffset = 0;
        let browAngle = 0.2; 
        
        if (headTransform.expressions.browLeft > 0.1 || headTransform.expressions.browRight > 0.1) {
            browOffset = (headTransform.expressions.browLeft + headTransform.expressions.browRight) * 0.15;
            browAngle = 0.0; 
        } else if (isSpeaking) {
             browOffset = 0.02;
        }

        const targetY = baseY + browOffset;
        leftEyebrowRef.current.position.y = THREE.MathUtils.lerp(leftEyebrowRef.current.position.y, targetY, 10 * delta);
        rightEyebrowRef.current.position.y = THREE.MathUtils.lerp(rightEyebrowRef.current.position.y, targetY, 10 * delta);
        
        const targetRotZ = browAngle + (browOffset * 1.0);
        leftEyebrowRef.current.rotation.z = THREE.MathUtils.lerp(leftEyebrowRef.current.rotation.z, -targetRotZ, 10 * delta);
        rightEyebrowRef.current.rotation.z = THREE.MathUtils.lerp(rightEyebrowRef.current.rotation.z, targetRotZ, 10 * delta);
    }

    // --- Head Tracking & Gaze Logic ---
    if (headRef.current) {
      let targetRotX = headTransform.rotation.x;
      let targetRotY = headTransform.rotation.y;
      let targetRotZ = headTransform.rotation.z;

      // If speaking, add subtle head bobbing instead of overriding gaze
      if (isSpeaking) {
          const speechBob = Math.sin(state.clock.elapsedTime * 15) * 0.02;
          targetRotX += speechBob;
      }

      // Smooth tracking
      const lerpSpeed = 8 * delta;
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetRotX, lerpSpeed);
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetRotY, lerpSpeed);
      headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, targetRotZ, lerpSpeed);
    }

    // --- Body Movement Logic ---
    if (bodyGroupRef.current) {
        const targetX = headTransform.position.x * 0.5;
        const targetY = -1.5 + (headTransform.position.y * 0.3);

        bodyGroupRef.current.position.x = THREE.MathUtils.lerp(bodyGroupRef.current.position.x, targetX, 2 * delta);
        bodyGroupRef.current.position.y = THREE.MathUtils.lerp(bodyGroupRef.current.position.y, targetY, 2 * delta);
        bodyGroupRef.current.rotation.y = THREE.MathUtils.lerp(bodyGroupRef.current.rotation.y, headTransform.rotation.y * 0.3, 2 * delta);
    }

    // Idle Animation
    const time = state.clock.getElapsedTime();
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(time * 1.0) * 0.1;
      rightArmRef.current.rotation.x = -Math.sin(time * 1.0) * 0.1;
    }

    // --- Blinking Logic ---
    // Random blink interval between 2 and 6 seconds
    if (state.clock.elapsedTime > nextBlinkTime.current) {
        isBlinking.current = true;
        nextBlinkTime.current = state.clock.elapsedTime + 2 + Math.random() * 4;
    }

    if (isBlinking.current) {
        // Blink duration approx 0.15s
        const blinkSpeed = 15 * delta;
        // Close eyes
        if (eyeScale.current > 0.1) {
            eyeScale.current = THREE.MathUtils.lerp(eyeScale.current, 0, blinkSpeed);
        } else {
            // Eyes closed, start opening
            isBlinking.current = false; 
        }
    } else {
        // Open eyes
        eyeScale.current = THREE.MathUtils.lerp(eyeScale.current, 1, 15 * delta);
    }
  });

  return (
    <group ref={bodyGroupRef} position={[0, -1.5, 0]} scale={1.3}>
      {/* HEAD Group - Roblox Style (Blocky) */}
      <group position={[0, 2.4, 0]} ref={headRef}>
        {/* Main Head Block */}
        <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.1} smoothness={4} material={skinMaterial} />
        
        {/* CAP - Backwards & Oversized */}
        <group position={[0, 0.6, 0]} rotation={[0, Math.PI, 0]}> 
            {/* Cap Dome */}
            <RoundedBox args={[1.25, 0.4, 1.25]} radius={0.1} smoothness={4} material={capMaterial} position={[0, 0, 0]} />
            {/* Cap Brim */}
            <RoundedBox args={[1.3, 0.1, 0.6]} radius={0.05} smoothness={2} material={capMaterial} position={[0, -0.15, 0.8]} rotation={[0.1, 0, 0]} />
            {/* Sticker */}
            <mesh position={[0.3, -0.16, 0.9]} rotation={[0.1, 0, 0]} material={goldMaterial}>
                <cylinderGeometry args={[0.1, 0.1, 0.01, 16]} />
            </mesh>
        </group>

        {/* Face */}
        <group position={[0, 0, 0.61]}>
            {/* Eyes */}
            <mesh position={[-0.3, 0.1, 0]} material={eyeMaterial} scale={[1, eyeScale.current, 1]}><planeGeometry args={[0.15, 0.2]} /></mesh>
            <mesh position={[0.3, 0.1, 0]} material={eyeMaterial} scale={[1, eyeScale.current, 1]}><planeGeometry args={[0.15, 0.2]} /></mesh>
            
            {/* Eyebrows */}
            <mesh ref={leftEyebrowRef} position={[-0.3, 0.25, 0.01]} material={eyeMaterial}><planeGeometry args={[0.25, 0.05]} /></mesh>
            <mesh ref={rightEyebrowRef} position={[0.3, 0.25, 0.01]} material={eyeMaterial}><planeGeometry args={[0.25, 0.05]} /></mesh>

            {/* Mouth */}
            <mesh ref={mouthRef} position={[0, -0.2, 0]} material={eyeMaterial}>
              <planeGeometry args={[0.3, 0.1]} />
            </mesh>
        </group>
      </group>

      {/* TORSO - Oversized Shirt */}
      <group position={[0, 1.0, 0]}>
        {/* Main Torso Block - Wider for oversized look */}
        <RoundedBox args={[2.2, 2.0, 1.1]} radius={0.1} smoothness={4} material={shirtMaterial} />
        
        {/* Graphic */}
        <mesh position={[0, 0.1, 0.56]} material={glowingEyeMaterial}>
            <planeGeometry args={[0.6, 0.6]} />
        </mesh>
      </group>

      {/* ARMS - ROBOTIC */}
      <group position={[-1.3, 1.6, 0]} ref={leftArmRef}>
        {/* Shoulder Joint */}
        <Sphere args={[0.4, 16, 16]} material={darkMetalMaterial} position={[0, 0, 0]} />
        {/* Upper Arm */}
        <RoundedBox args={[0.5, 0.8, 0.5]} radius={0.05} smoothness={2} material={metalMaterial} position={[0, -0.5, 0]} />
        {/* Elbow */}
        <Sphere args={[0.35, 16, 16]} material={darkMetalMaterial} position={[0, -1.0, 0]} />
        {/* Lower Arm */}
        <RoundedBox args={[0.45, 0.8, 0.45]} radius={0.05} smoothness={2} material={metalMaterial} position={[0, -1.5, 0]} />
        {/* Hand */}
        <RoundedBox args={[0.4, 0.4, 0.4]} radius={0.1} smoothness={2} material={darkMetalMaterial} position={[0, -2.0, 0]} />
      </group>

      <group position={[1.3, 1.6, 0]} ref={rightArmRef}>
        {/* Shoulder Joint */}
        <Sphere args={[0.4, 16, 16]} material={darkMetalMaterial} position={[0, 0, 0]} />
        {/* Upper Arm */}
        <RoundedBox args={[0.5, 0.8, 0.5]} radius={0.05} smoothness={2} material={metalMaterial} position={[0, -0.5, 0]} />
        {/* Elbow */}
        <Sphere args={[0.35, 16, 16]} material={darkMetalMaterial} position={[0, -1.0, 0]} />
        {/* Lower Arm */}
        <RoundedBox args={[0.45, 0.8, 0.45]} radius={0.05} smoothness={2} material={metalMaterial} position={[0, -1.5, 0]} />
        {/* Hand */}
        <RoundedBox args={[0.4, 0.4, 0.4]} radius={0.1} smoothness={2} material={darkMetalMaterial} position={[0, -2.0, 0]} />
      </group>

      {/* LEGS - Baggy Shorts & Sneakers */}
      <group position={[-0.6, -0.5, 0]}>
         {/* Baggy Shorts Leg */}
         <RoundedBox args={[0.9, 1.2, 0.9]} radius={0.1} smoothness={4} material={pantsMaterial} position={[0, 0.6, 0]} />
         {/* Skin Leg visible below */}
         <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.05} smoothness={2} material={skinMaterial} position={[0, -0.1, 0]} />
         
         {/* Shoe Left */}
         <group position={[0, -0.5, 0.1]}>
            <RoundedBox args={[0.7, 0.4, 1.0]} radius={0.1} smoothness={4} material={shoeMaterial} position={[0, 0, 0]} />
         </group>
      </group>
      <group position={[0.6, -0.5, 0]}>
         {/* Baggy Shorts Leg */}
         <RoundedBox args={[0.9, 1.2, 0.9]} radius={0.1} smoothness={4} material={pantsMaterial} position={[0, 0.6, 0]} />
         {/* Skin Leg visible below */}
         <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.05} smoothness={2} material={skinMaterial} position={[0, -0.1, 0]} />
         
         {/* Shoe Right */}
         <group position={[0, -0.5, 0.1]}>
            <RoundedBox args={[0.7, 0.4, 1.0]} radius={0.1} smoothness={4} material={shoeMaterial} position={[0, 0, 0]} />
         </group>
      </group>
    </group>
  );
}
