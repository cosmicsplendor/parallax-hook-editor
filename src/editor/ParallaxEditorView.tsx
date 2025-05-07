// src/editor/ParallaxEditorView.tsx
import React, { useContext } from 'react';
import { Box, Grid, Button, Typography, Paper, Stack } from '@mui/material';
import { Player } from '@remotion/player';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ParallaxEditorContext, defaultEditorState } from './context/ParallaxEditorContext';
import { ParallaxComposition } from '../remotion/ParallaxComposition'; // We'll create this
import { GlobalSettingsPanel, CameraPanel, LayerPanel, ElementPanel } from './components/Panels';
import { ParallaxConfig, SVGElementData } from './types';
import { SVGViewer } from './components/SVGViewer';

const WorkspacePreview: React.FC = () => {
    const { state, dispatch } = useContext(ParallaxEditorContext);
    const { layers, camera, width, height, backgroundColor, selectedLayerId, selectedElementId } = state;

    // Simplified preview: show elements at their initial positions
    // and camera at initial position for context.
    // A more advanced preview would use currentFrame and interpolate.
    const cameraX = camera.initialX;
    const cameraY = camera.initialY;
    const cameraZoom = camera.initialZoom;
    const handleDragStop = (
        e: DraggableEvent,
        data: DraggableData,
        layerId: string,
        elementId: string
    ) => {
        // data.x and data.y are the new positions relative to the element's starting point in the DOM.
        // We need to find the element's original state.x, state.y and add data.deltaX, data.deltaY
        // Or, if bounds are set carefully, data.x and data.y might directly map.
        // For simplicity here, assuming react-draggable gives positions that can be directly used
        // if the parent element of Draggable is the layer itself (after its parallax offset).
        // However, direct update of data.x and data.y is simpler for uncontrolled components.
        // For controlled components, we need to update the source of truth (our state).

        const layer = state.layers.find(l => l.id === layerId);
        const element = layer?.elements.find(el => el.id === elementId);
        if (element) {
            // The x and y from Draggable are relative to its offsetParent.
            // We need to adjust for camera zoom if we want the state x/y to be "world" coordinates.
            // For simplicity, this example directly updates x and y based on drag.
            // Consider how `cameraZoom` affects pixel values vs. world units.
            // If element.x/y are "world" units, then the delta from draggable should be scaled.
            // deltaX_world = data.deltaX / cameraZoom
            // newX = element.x + data.deltaX / cameraZoom (if draggable is on the scaled element)
            // OR if draggable is on an unscaled container whose children are scaled:
            // newX = element.x + data.deltaX
            // Let's assume element.x/y are coordinates within the layer's unscaled space for editor manipulation.

            dispatch({
                type: 'UPDATE_ELEMENT_PROPERTIES',
                payload: {
                    layerId,
                    elementId,
                    properties: {
                        x: element.x + data.deltaX, // Draggable reports delta
                        y: element.y + data.deltaY,
                    }
                }
            });
        }
    };
    return (
        <Paper
            elevation={1}
            sx={{
                width: '100%',
                aspectRatio: `${width} / ${height}`,
                backgroundColor: backgroundColor,
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #ccc',
                transformOrigin: 'center center',
            }}
        >
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', width: '10px', height: '10px', background: 'rgba(0,0,0,0.2)', transform: 'translate(-50%, -50%)', borderRadius: '50%' }} />

            {[...layers].sort((a, b) => a.zIndex - b.zIndex).map(layer => {
                if (!layer.isVisible) return null;

                const layerOffsetX = -cameraX * layer.parallaxFactor.x;
                const layerOffsetY = -cameraY * layer.parallaxFactor.y;

                return (
                    <Box
                        key={layer.id}
                        sx={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            transform: `translate(${layerOffsetX}px, ${layerOffsetY}px)`,
                            outline: layer.id === selectedLayerId ? '2px dashed blue' : 'none',
                            outlineOffset: '-2px',
                            // This box is the reference for element positions within the layer for dragging
                        }}
                    >
                        {[...(layer.elements || [])] // Ensure elements array exists
                            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)) // Sort elements by zIndex
                            .map(element => (
                                <Draggable
                                    key={element.id}
                                    position={{ x: element.x, y: element.y }} // Controlled position
                                    onStop={(e, data) => handleDragStop(e, data, layer.id, element.id)}
                                    disabled={layer.id !== selectedLayerId || element.id !== selectedElementId} // Only drag selected element
                                    bounds="parent" // Constrain dragging within the layer's visible area in editor
                                >
                                    <Box
                                        // No need for position:absolute on the Draggable child if it's the direct child.
                                        // Draggable applies transform: translate(x,y)
                                        sx={{
                                            width: element.width * element.scale, // Apply scale to intrinsic size
                                            height: element.height * element.scale,
                                            opacity: element.opacity,
                                            transformOrigin: `${element.transformOriginX * 100}% ${element.transformOriginY * 100}%`, // Apply transform origin
                                            // Base transform for scale and initial rotation. Draggable handles translate.
                                            transform: `scale(${cameraZoom}) rotate(${element.initialRotation}deg)`,
                                            outline: element.id === selectedElementId && layer.id === selectedLayerId ? '1px dashed red' : 'none',
                                            cursor: (layer.id === selectedLayerId && element.id === selectedElementId) ? 'grab' : 'default',
                                            // zIndex for stacking visual in editor workspace (CSS stacking context)
                                            // This is distinct from the data zIndex used for Remotion render order.
                                            // For visual editor accuracy, we use the data zIndex here as well.
                                            zIndex: element.zIndex,
                                            position: 'absolute', // Crucial for Draggable's position to work relative to the parent layer Box
                                            // AND for zIndex to work correctly among siblings.
                                            // The Draggable component itself will be positioned at element.x, element.y by its internal transform.
                                            // So, the "left" and "top" here should be from the center of the layer.
                                            left: `calc(50%)`, // Centered in parent initially by Draggable
                                            top: `calc(50%)`,  // Centered in parent initially by Draggable
                                            // The element.x and element.y are handled by Draggable's transform.
                                            // We need to apply translate(-50%, -50%) to center the element's origin itself.
                                            // This combines with Draggable's translate(element.x, element.y)
                                            // and our own scale/rotate.
                                            // Let's simplify: Draggable directly applies translate(element.x, element.y).
                                            // The rest of the transforms (scale, rotate) are applied to the child.
                                            // The position:absolute makes it part of the flow that Draggable understands.
                                            // The transform string below gets complex with Draggable.
                                            // Let's ensure Draggable's x,y are relative to the layer center.
                                            // The `position` prop of Draggable sets its `transform: translate(x,y)`.
                                            // The `left/top: 50%` and then `translate(-50%,-50%)` inside the transform string is for centering the element at its (0,0) point
                                            // relative to the draggable's position.

                                            // Revised transform for the inner Box (child of Draggable):
                                            // Draggable handles translate(element.x, element.y) for the outer wrapper it creates.
                                            // The Box below is the content.
                                            // The x,y are already applied by Draggable.
                                            // The scale, rotation needs to be applied, and transform-origin.
                                            // The `cameraZoom` scaling should apply to the "world" or "viewport" not individual elements directly here if parallax is handled.
                                            // The WorkspacePreview is a simplified view.
                                            // Let's make element.x and element.y be offsets from the layer's center (0,0).
                                            // So Draggable's `position={{x: element.x, y: element.y}}` is correct.
                                            // The inner box is for visuals:
                                        }}
                                    >
                                        <Box sx={{ // This inner box is for the SVG itself and its scaling/rotation
                                            width: '100%', // Takes width/height from parent Draggable's controlled child
                                            height: '100%',
                                            transformOrigin: `${element.transformOriginX * 100}% ${element.transformOriginY * 100}%`,
                                            transform: `scale(${element.scale * cameraZoom}) rotate(${element.initialRotation}deg)`, // Apply element scale and initial rotation. CameraZoom affects apparent size.
                                            // zIndex: element.zIndex, // zIndex on the Draggable's wrapper is better for stacking context
                                        }}>
                                            <SVGViewer svgString={element.svgString} width="100%" height="100%" />
                                        </Box>
                                    </Box>
                                </Draggable>
                            ))}
                    </Box>
                );
            })}
        </Paper>
    );
};


export const ParallaxEditorView: React.FC = () => {
    const { state, dispatch } = useContext(ParallaxEditorContext);

    const handleExport = () => {
        const configToExport: ParallaxConfig = {
            compositionName: state.compositionName,
            durationInFrames: state.durationInFrames,
            fps: state.fps,
            width: state.width,
            height: state.height,
            backgroundColor: state.backgroundColor,
            camera: state.camera,
            layers: state.layers,
        };
        const jsonString = JSON.stringify(configToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${state.compositionName || 'parallax-config'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedConfig = JSON.parse(e.target?.result as string) as ParallaxConfig;
                    // Basic validation could be added here
                    dispatch({ type: 'SET_INITIAL_STATE', payload: importedConfig });
                } catch (err) {
                    alert("Error importing file. Make sure it's a valid JSON configuration.");
                    console.error(err);
                }
            };
            reader.readAsText(file);
        }
    };

    const inputRef = React.useRef<HTMLInputElement>(null);
    const triggerImportClick = () => inputRef.current?.click();


    return (
        <Box sx={{ display: 'flex', height: '100vh', p: 1, gap: 1, bgcolor: 'grey.200' }}>
            {/* Left Panel: Controls */}
            <Box sx={{ width: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Paper sx={{ p: 1 }}>
                    <Typography variant="h5" align="center" gutterBottom>Parallax Editor</Typography>
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Button variant="outlined" size="small" onClick={handleExport}>Export JSON</Button>
                        <Button variant="outlined" size="small" onClick={triggerImportClick}>Import JSON</Button>
                        <input type="file" ref={inputRef} hidden accept=".json" onChange={handleImport} />
                    </Stack>
                </Paper>
                <GlobalSettingsPanel />
                <CameraPanel />
                <LayerPanel />
                <ElementPanel />
            </Box>

            {/* Center Panel: Workspace Preview and Remotion Player */}
            <Grid container direction="column" sx={{ flex: 1, gap: 1 }}>
                <Grid sx={{ flexBasis: '50%', minHeight: '300px' }}>
                    <Typography variant="overline">Editor Workspace (Static Preview)</Typography>
                    <WorkspacePreview />
                </Grid>
                <Grid sx={{ flexBasis: '50%', minHeight: '300px' }}>
                    <Typography variant="overline">Remotion Player (Live Preview)</Typography>
                    <Player
                        component={ParallaxComposition}
                        inputProps={state as ParallaxConfig} // Pass the whole state, composition will pick what it needs
                        durationInFrames={state.durationInFrames}
                        compositionWidth={state.width}
                        compositionHeight={state.height}
                        fps={state.fps}
                        style={{ width: '100%', height: 'calc(100% - 20px)' }}
                        controls
                        loop
                    />
                </Grid>
            </Grid>
        </Box>
    );
};