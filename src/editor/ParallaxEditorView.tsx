// src/editor/ParallaxEditorView.tsx
import React, { useContext } from 'react';
import { Box, Grid, Button, Typography, Paper, Stack } from '@mui/material';
import { Player } from '@remotion/player';
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
                                <Box
                                key={element.id}
                                sx={{
                                position: 'absolute',
                                // Position relative to layer center, then offset by element's X/Y
                                // Then viewport center is (width/2, height/2)
                                left: `calc(50% + ${element.x}px)`,
                                top: `calc(50% + ${element.y}px)`,
                                width: element.width * element.scale, // Apply scale to intrinsic size
                                height: element.height * element.scale,
                                opacity: element.opacity,
                                transformOrigin: 'center center',
                                transform: `translate(-50%, -50%) scale(${cameraZoom}) rotate(${element.initialRotation}deg)`, // Element's own transform
                                outline: element.id === selectedElementId && layer.id === selectedLayerId ? '1px dashed red' : 'none',
                                }}
                                >
                                <SVGViewer svgString={element.svgString} width="100%" height="100%" />
                                
                                {/* Transform origin indicator - rendered on top of SVG */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: 'white',
                                        border: '1px solid black',
                                        transform: `translate(-50%, -50%) scale(${1/cameraZoom})`, // Counter the camera zoom to keep size consistent
                                        zIndex: 1000, // Ensure it's on top
                                        pointerEvents: 'none', // Don't interfere with clicking
                                    }}
                                />
                                </Box>
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