import React, { Suspense, Component, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Html } from '@react-three/drei';
import { BearAvatar } from './BearAvatar';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="text-red-500 font-bold bg-white p-2 rounded shadow text-center text-xs w-32">
            Load Error
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

interface ExperienceProps {
  analyser: AnalyserNode | null;
  headTransform: {
    rotation: { x: number, y: number, z: number };
    position: { x: number, y: number };
    expressions: { browLeft: number; browRight: number };
  };
}

export function Experience({ analyser, headTransform }: ExperienceProps) {
  return (
    <Canvas
      camera={{ position: [0, 1, 5], fov: 45 }}
      shadows
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent', pointerEvents: 'none' }}
    >
      {/* Transparent background for overlay effect */}

      <ErrorBoundary>
        <Suspense fallback={null}>
          <group position={[0, -1, 0]}>
            <BearAvatar analyser={analyser} headTransform={headTransform} />
          </group>
          {/* Outdoor lighting for adventure look */}
          <Environment preset="park" />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
          <spotLight position={[-5, 5, 5]} intensity={0.5} />
        </Suspense>
      </ErrorBoundary>

      <ContactShadows
        opacity={0.15}
        scale={15}
        blur={5}
        far={4}
        resolution={512}
        color="#000000"
      />
      <color attach="background" args={['transparent']} />
    </Canvas>
  );
}
