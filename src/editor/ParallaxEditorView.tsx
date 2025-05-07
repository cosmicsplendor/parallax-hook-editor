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
                                        sx={{
                                            width: element.width * element.scale, // Apply scale to intrinsic size
                                            height: element.height * element.scale,
                                            opacity: element.opacity,
                                            transformOrigin: `${element.transformOriginX * 100}% ${element.transformOriginY * 100}%`,
                                            transform: `scale(${cameraZoom}) rotate(${element.initialRotation}deg)`,
                                            outline: element.id === selectedElementId && layer.id === selectedLayerId ? '1px dashed red' : 'none',
                                            cursor: (layer.id === selectedLayerId && element.id === selectedElementId) ? 'grab' : 'default',
                                            zIndex: element.zIndex,
                                            position: 'absolute',
                                            left: `calc(50%)`, // Centered in parent initially by Draggable
                                            top: `calc(50%)`,  // Centered in parent initially by Draggable
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                width: '100%',
                                                height: '100%',
                                                transformOrigin: `${element.transformOriginX * 100}% ${element.transformOriginY * 100}%`,
                                                transform: `scale(${element.scale * cameraZoom}) rotate(${element.initialRotation}deg)`,
                                            }}
                                        >
                                            <SVGViewer svgString={element.svgString} width="100%" height="100%" />
                                            {/* Transform Origin Indicator with counter-scale */}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: `${element.transformOriginY * 100}%`,
                                                    left: `${element.transformOriginX * 100}%`,
                                                    width: 8,
                                                    height: 8,
                                                    backgroundColor: 'white',
                                                    border: '1px solid black',
                                                    borderRadius: '50%',
                                                    // Cancel out parent's scale so the indicator remains a constant size:
                                                    transform: `translate(-50%, -50%) scale(${1 / (element.scale * cameraZoom)})`,
                                                }}
                                            />
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