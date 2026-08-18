import { Canvas } from "@react-three/fiber";
import { ContactShadows, Float, OrbitControls } from "@react-three/drei";

function Bowl() {
  return (
    <group rotation={[-0.12, 0.35, 0]}>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[1.55, 1.18, 0.5, 64]} />
        <meshStandardMaterial color="#d6d7dc" roughness={0.4} metalness={0.05} />
      </mesh>

      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[1.4, 1.25, 0.14, 64]} />
        <meshStandardMaterial color="#f2f4f5" roughness={0.35} />
      </mesh>

      {[
        [-0.62, 0.18, -0.38, "#72a953"],
        [-0.2, 0.22, 0.42, "#4e884d"],
        [0.38, 0.22, -0.35, "#d29c50"],
        [0.58, 0.26, 0.34, "#d17e62"],
        [0.0, 0.3, -0.02, "#e2c275"]
      ].map(([x, y, z, color], index) => (
        <mesh
          key={index}
          position={[x as number, y as number, z as number]}
          scale={[0.42, 0.18, 0.34]}
        >
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color={color as string} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

export function MealScene() {
  return (
    <div className="three meal-scene">
      <Canvas camera={{ position: [0, 2.6, 4.8], fov: 35 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 6, 4]} intensity={2.4} />
        <Float speed={1.2} floatIntensity={0.2} rotationIntensity={0.08}>
          <Bowl />
        </Float>
        <ContactShadows
          position={[0, -0.62, 0]}
          scale={5}
          blur={2.5}
          opacity={0.35}
        />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.7}
        />
      </Canvas>
    </div>
  );
}
