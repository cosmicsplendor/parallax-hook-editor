// src/editor/types.ts
import { CompositionProps } from 'remotion';

export type AnimationType = 'easing' | 'spring';

export interface SVGElementData {
  id: string;
  name: string;
  svgString: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  // rotation: number; // This will now be derived from initial/final for animation
  width: number;
  height: number;

  // New properties for Feature 1 & 3
  initialRotation: number;    // Degrees
  finalRotation: number;      // Degrees
  transformOriginX: number;   // Normalized 0-1 (default 0.5)
  transformOriginY: number;   // Normalized 0-1 (default 0.5)
  rotationAnimationType: AnimationType; // Easing or Spring
  zIndex: number;             // For sorting within the layer
}

export interface LayerData {
  id: string;
  name: string;
  parallaxFactor: { x: number; y: number }; // 0 = fixed, 1 = moves with camera
  zIndex: number;
  elements: SVGElementData[];
  isVisible: boolean;
}

export interface CameraConfig {
  initialX: number;
  initialY: number;
  initialZoom: number;
  finalX: number;
  finalY: number;
  finalZoom: number;
}

export interface ParallaxConfig {
  compositionName: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  backgroundColor: string;
  camera: CameraConfig;
  layers: LayerData[];
}

export interface EditorState extends ParallaxConfig {
  selectedLayerId: string | null;
  selectedElementId: string | null;
  // No currentFrame here for editor preview if we simplify that much
}

// For Remotion Composition props
export type MyCompositionProps = CompositionProps<ParallaxConfig, any>