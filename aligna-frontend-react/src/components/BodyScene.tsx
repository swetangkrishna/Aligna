import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";

type MuscleTone = "ready" | "recovering" | "trained";

const colors: Record<MuscleTone, string> = {
  ready: "#67efcb",
  recovering: "#9b7cff",
  trained: "#ff6d7f"
};

function Capsule({
  position,
  scale,
  tone = "ready",
  rotation = [0, 0, 0]
}: {
  position: [number, number, number];
  scale: [number, number, number];
  tone?: MuscleTone;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} scale={scale} rotation={rotation}>
      <capsuleGeometry args={[0.5, 1.0, 12, 28]} />
      <meshPhysicalMaterial
        color={colors[tone]}
        roughness={0.28}
        metalness={0.05}
        transmission={0.08}
        emissive={colors[tone]}
        emissiveIntensity={0.08}
      />
    </mesh>
  );
}

function Body() {
  return (
    <group position={[0, 0.2, 0]}>
      <mesh position={[0, 2.75, 0]} scale={[0.58, 0.66, 0.56]}>
        <sphereGeometry args={[0.6, 42, 42]} />
        <meshPhysicalMaterial
          color="#8495bf"
          transparent
          opacity={0.65}
          roughness={0.25}
        />
      </mesh>

      <mesh position={[0, 1.55, 0]} scale={[1.02, 1.35, 0.52]}>
        <capsuleGeometry args={[0.62, 1.15, 16, 32]} />
        <meshPhysicalMaterial
          color="#6f7fa8"
          transparent
          opacity={0.48}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 1.72, 0.48]} scale={[0.86, 0.34, 0.18]}>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshStandardMaterial color={colors.recovering} emissive={colors.recovering} emissiveIntensity={0.12} />
      </mesh>

      <mesh position={[0, 1.55, -0.49]} scale={[0.92, 0.72, 0.18]}>
        <sphereGeometry args={[0.76, 32, 32]} />
        <meshStandardMaterial color={colors.ready} emissive={colors.ready} emissiveIntensity={0.12} />
      </mesh>

      <Capsule position={[-1.0, 1.55, 0]} scale={[0.38, 0.9, 0.38]} tone="recovering" rotation={[0,0,-0.18]} />
      <Capsule position={[1.0, 1.55, 0]} scale={[0.38, 0.9, 0.38]} tone="recovering" rotation={[0,0,0.18]} />
      <Capsule position={[-1.33, 0.52, 0]} scale={[0.27, 0.92, 0.27]} tone="trained" rotation={[0,0,-0.08]} />
      <Capsule position={[1.33, 0.52, 0]} scale={[0.27, 0.92, 0.27]} tone="trained" rotation={[0,0,0.08]} />
      <Capsule position={[-0.48, -0.65, 0]} scale={[0.46, 1.24, 0.48]} tone="ready" />
      <Capsule position={[0.48, -0.65, 0]} scale={[0.46, 1.24, 0.48]} tone="ready" />
      <Capsule position={[-0.48, -2.08, 0]} scale={[0.32, 1.0, 0.33]} tone="ready" />
      <Capsule position={[0.48, -2.08, 0]} scale={[0.32, 1.0, 0.33]} tone="ready" />
    </group>
  );
}

export function BodyScene() {
  return (
    <div className="three body-scene">
      <Canvas camera={{ position: [0, 0.45, 7.6], fov: 31 }}>
        <ambientLight intensity={1.45} />
        <directionalLight position={[4, 7, 5]} intensity={2.8} />
        <directionalLight position={[-4, 2, -4]} intensity={1.2} />
        <Body />
        <ContactShadows
          position={[0, -3.2, 0]}
          opacity={0.32}
          scale={6}
          blur={2.4}
        />
        <OrbitControls
          enablePan={false}
          minDistance={6.4}
          maxDistance={8.5}
          minPolarAngle={Math.PI / 2.75}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
}
