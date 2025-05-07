// src/editor/types.ts
import { CompositionProps } from 'remotion';

export interface SVGElementData {
  id: string;
  name: string;
  svgString: string; // Actual SVG content as a string
  x: number; // Position relative to layer center
  y: number;
  scale: number;
  opacity: number;
  rotation: number;
  width: number; // Original width from SVG (can be extracted or set manually)
  height: number; // Original height from SVG
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