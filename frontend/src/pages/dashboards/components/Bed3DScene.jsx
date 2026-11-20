import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, useCursor } from '@react-three/drei';
import { Box, Paper, Typography, Button } from '@mui/material';

// A simple 3D Bed Model component using geometric primitives
const BedModel = ({ position, status, bedNumber, onClick, isSelected }) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // Colors
  const mattressColor = status === 'Available' ? '#10b981' : '#ef4444'; // Green or Red
  const frameColor = '#334155';
  const pillowColor = '#f1f5f9';

  return (
    <group 
      position={position} 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Bed Frame (Legs) */}
      <mesh position={[-0.9, 0.25, -0.4]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      <mesh position={[0.9, 0.25, -0.4]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      <mesh position={[-0.9, 0.25, 0.4]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      <mesh position={[0.9, 0.25, 0.4]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>

      {/* Bed Base */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2, 0.2, 1]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>

      {/* Mattress */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.9, 0.2, 0.9]} />
        <meshStandardMaterial color={mattressColor} metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Pillow */}
      <mesh position={[-0.7, 0.95, 0]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.4, 0.15, 0.6]} />
        <meshStandardMaterial color={pillowColor} />
      </mesh>

      {/* Blanket (if occupied) */}
      {status === 'Occupied' && (
        <mesh position={[0.2, 0.91, 0]}>
          <boxGeometry args={[1.3, 0.05, 0.92]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
      )}

      {/* Label */}
      <Html position={[0, 1.5, 0]} center distanceFactor={10}>
        <div style={{ 
          background: 'rgba(0,0,0,0.7)', 
          color: 'white', 
          padding: '2px 6px', 
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          Bed {bedNumber}
        </div>
        {status === 'Occupied' && (
             <div style={{ color: '#ef4444', fontSize: '10px', textAlign: 'center', fontWeight: 'bold' }}>Occupied</div>
        )}
      </Html>
      
      {/* Selection Highlight */}
      {isSelected && (
        <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[1.2, 1.2, 0.1, 32]} />
            <meshBasicMaterial color="yellow" opacity={0.5} transparent />
        </mesh>
      )}
    </group>
  );
};

const RoomFloor = () => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#e5e7eb" />
            <gridHelper args={[20, 20, '#94a3b8', '#cbd5e1']} rotation={[-Math.PI/2, 0, 0]} />
        </mesh>
    );
}

const Bed3DScene = ({ beds, onBedClick, selectedBedId }) => {
  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '16px', overflow: 'hidden', background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)' }}>
      <Canvas shadows camera={{ position: [5, 5, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <RoomFloor />
        
        <OrbitControls 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2.1} 
            maxDistance={15}
            minDistance={3}
        />

        {beds.map((bed, index) => {
            // Organize beds in a grid
            const row = Math.floor(index / 5);
            const col = index % 5;
            const x = (col - 2) * 2.5;
            const z = (row - 1.5) * 3; // Spacing

            return (
                <BedModel 
                    key={bed._id}
                    position={[x, 0, z]}
                    status={bed.status}
                    bedNumber={bed.bed_number}
                    onClick={() => onBedClick(bed)}
                    isSelected={selectedBedId === bed._id}
                />
            );
        })}
      </Canvas>
      
      <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '8px' }}>
          <Typography variant="caption" display="block"><b>Controls:</b></Typography>
          <Typography variant="caption" display="block">• Left Click to Select</Typography>
          <Typography variant="caption" display="block">• Left Drag to Rotate</Typography>
          <Typography variant="caption" display="block">• Right Drag to Pan</Typography>
          <Typography variant="caption" display="block">• Scroll to Zoom</Typography>
      </div>
    </div>
  );
};

export default Bed3DScene;
