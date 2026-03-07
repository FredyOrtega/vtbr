import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Standard ReadyPlayer.me avatar URL
const AVATAR_URL = 'https://models.readyplayer.me/658be9e8fc8be9fdb3c67c11.glb';

interface AvatarProps {
  analyser: AnalyserNode | null;
}

export function Avatar({ analyser }: AvatarProps) {
  const { scene } = useGLTF(AVATAR_URL);
  const { nodes } = useGraph(scene);
  const headMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  
  // Audio data buffer
  const dataArray = useRef(new Uint8Array(analyser?.frequencyBinCount || 256));

  // Blink state
  const blinkTimeout = useRef<NodeJS.Timeout | null>(null);
  const isBlinking = useRef(false);

  useEffect(() => {
    // Find the head mesh which contains the blendshapes
    // ReadyPlayer.me avatars usually have a mesh named 'Wolf3D_Head' or similar
    const head = Object.values(nodes).find((node: any) => 
      node.isSkinnedMesh && (node.name === 'Wolf3D_Head' || node.name === 'Wolf3D_Avatar')
    ) as THREE.SkinnedMesh;

    if (head) {
      headMeshRef.current = head;
    }
  }, [nodes]);

  // Helper function from your snippet
  const getAverageVolume = (array: Uint8Array, start: number, end: number) => {
    let values = 0;
    for (let i = start; i <= end; i++) values += array[i];
    return values / (end - start + 1);
  };

  const triggerEyeBlink = () => {
    if (isBlinking.current) return;
    
    isBlinking.current = true;
    
    // Blink duration ~150ms
    setTimeout(() => {
      isBlinking.current = false;
    }, 150);
  };

  useFrame((state, delta) => {
    if (!headMeshRef.current || !headMeshRef.current.morphTargetDictionary || !headMeshRef.current.morphTargetInfluences) return;

    const dictionary = headMeshRef.current.morphTargetDictionary;
    const influences = headMeshRef.current.morphTargetInfluences;

    // --- Lip Sync Logic ---
    let mouthOpenTarget = 0;

    if (analyser) {
      // Update frequency data
      if (dataArray.current.length !== analyser.frequencyBinCount) {
        dataArray.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataArray.current);

      // 1. Calculate intensity (using low frequencies for jaw movement)
      // Using range 0-15 as per your snippet
      mouthOpenTarget = getAverageVolume(dataArray.current, 0, 15) / 255;
      
      // Boost the signal a bit since speech can be quiet
      mouthOpenTarget = Math.min(1, mouthOpenTarget * 2.5);
    }

    // 2. Exponential Smoothing
    const smoothSpeed = 12.0;
    const currentJawOpen = influences[dictionary['jawOpen']] || 0;
    
    influences[dictionary['jawOpen']] = THREE.MathUtils.lerp(
      currentJawOpen,
      mouthOpenTarget,
      1 - Math.exp(-smoothSpeed * delta)
    );

    // Also affect mouthOpen slightly for better shape
    if (dictionary['mouthOpen'] !== undefined) {
        influences[dictionary['mouthOpen']] = influences[dictionary['jawOpen']] * 0.3;
    }

    // --- Eye Blink Logic ---
    // 3. Random micro-expressions (blinking)
    // Your snippet: if (Math.random() > 0.98) triggerEyeBlink();
    // We need to be careful not to blink too often in a 60fps loop.
    // 0.995 is roughly once every few seconds at 60fps
    if (Math.random() > 0.995) {
      triggerEyeBlink();
    }

    // Apply blink
    const blinkTarget = isBlinking.current ? 1 : 0;
    const currentBlink = influences[dictionary['eyeBlinkLeft']] || 0;
    
    // Smooth blink
    const blinkValue = THREE.MathUtils.lerp(currentBlink, blinkTarget, 0.5);
    
    if (dictionary['eyeBlinkLeft'] !== undefined) influences[dictionary['eyeBlinkLeft']] = blinkValue;
    if (dictionary['eyeBlinkRight'] !== undefined) influences[dictionary['eyeBlinkRight']] = blinkValue;
  });

  return <primitive object={scene} position={[0, -1.5, 0]} />;
}

// Preload the model
useGLTF.preload(AVATAR_URL);
