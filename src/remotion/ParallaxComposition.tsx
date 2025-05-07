// src/remotion/ParallaxComposition.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import styled from 'styled-components';
import { MyCompositionProps, SVGElementData as EditorSVGElementData, LayerData as EditorLayerData } from '../editor/types'; // Import editor types
import { SVGViewer } from '../editor/components/SVGViewer'; // Reuse the simple SVG viewer

// Styled components for Remotion elements if needed
const LayerContainer = styled(AbsoluteFill)`
  /* transform-origin: center center; // default */
`;

const ElementContainer = styled.div<{
  x: number;
  y: number;
  scale: number;
  opacity: number;
  rotation: number;
  elWidth: number;
  elHeight: number;
}>`
  position: absolute;
  left: 50%; // Center of the parent (layer)
  top: 50%;
  width: ${(props) => props.elWidth}px;
  height: ${(props) => props.elHeight}px;
  opacity: ${(props) => props.opacity};
  transform-origin: center center;
  transform: translate(calc(-50% + ${(props) => props.x}px), calc(-50% + ${(props) => props.y}px))
             scale(${(props) => props.scale})
             rotate(${(props) => props.rotation}deg);
`;


export const ParallaxComposition: React.FC<any> = ({
  durationInFrames,
  fps,
  width,
  height,
  compositionName,
  backgroundColor,
  camera,
  layers,
}) => {
  const frame = useCurrentFrame();

  // Camera animation (linear interpolation for simplicity)
  const cameraProgress = frame / (durationInFrames -1); // 0 to 1
  
  const currentCameraX = interpolate(
    cameraProgress,
    [0, 1],
    [camera.initialX, camera.finalX],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const currentCameraY = interpolate(
    cameraProgress,
    [0, 1],
    [camera.initialY, camera.finalY],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const currentCameraZoom = interpolate(
    cameraProgress,
    [0, 1],
    [camera.initialZoom, camera.finalZoom],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.25,.1,.25,1) } // Smooth zoom
  );

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <AbsoluteFill
        style={{
          // This AbsoluteFill represents the "world" that the camera looks at.
          // We move the world in the opposite direction of the camera and scale it.
          transformOrigin: 'center center',
          transform: `scale(${currentCameraZoom}) translate(${-currentCameraX}px, ${-currentCameraY}px)`,
        }}
      >
        {/* Sort layers by zIndex for correct visual stacking */}
        {[...layers]
          .filter(layer => layer.isVisible) // Only render visible layers
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((layer: EditorLayerData) => {
          // Parallax effect: Deeper layers (lower parallaxFactor) move less
          // ParallaxFactor = 0 means it's fixed to the camera (moves with screen)
          // ParallaxFactor = 1 means it's fixed to the world (moves opposite to camera)
          // For typical parallax, factors are between 0 and 1 for layers "behind" the focal plane,
          // and > 1 for layers "in front" of the focal plane.
          // Here, we'll interpret parallaxFactor as how much it "sticks" to the world.
          // A factor of 1 means it's fully part of the world. A factor of 0 means it ignores world movement.
          // This means layers with smaller parallaxFactor will appear to move slower / be further away.

          const layerEffectiveTranslateX = currentCameraX * (1 - layer.parallaxFactor.x);
          const layerEffectiveTranslateY = currentCameraY * (1 - layer.parallaxFactor.y);

          return (
            <LayerContainer
              key={layer.id}
              style={{
                // The layer itself is positioned relative to the "world" center.
                // Then, we apply a counter-translation based on its parallax factor.
                // This makes layers with smaller parallaxFactor appear to move less than the main camera movement.
                transform: `translate(${layerEffectiveTranslateX}px, ${layerEffectiveTranslateY}px)`,
                // zIndex here is for stacking within the Remotion DOM, less critical if sorted before map
                zIndex: layer.zIndex,
              }}
            >
              {layer.elements.map((element: EditorSVGElementData) => (
                <ElementContainer
                  key={element.id}
                  x={element.x}
                  y={element.y}
                  scale={element.scale}
                  opacity={element.opacity}
                  rotation={element.rotation}
                  elWidth={element.width}
                  elHeight={element.height}
                >
                  <SVGViewer svgString={element.svgString} width="100%" height="100%" />
                </ElementContainer>
              ))}
            </LayerContainer>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};