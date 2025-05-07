// src/editor/components/Panels.tsx
import React, { useContext, useRef } from 'react';
import {
  Box, Button, Stack, Typography, Paper, Divider, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, ListItemButton,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { ParallaxEditorContext } from '../context/ParallaxEditorContext';
import { NumberInput, TextInput, SliderInput, SwitchInput } from './PropertyInputs';
import { SVGElementData, AnimationType } from '../types';
import { SVGViewer } from './SVGViewer';

// --- Global Settings Panel ---
export const GlobalSettingsPanel: React.FC = () => {
  const { state, dispatch } = useContext(ParallaxEditorContext);

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Global Settings</Typography>
      <Stack spacing={2}>
        <TextInput
          label="Composition Name"
          value={state.compositionName}
          onChange={(val) => dispatch({ type: 'UPDATE_GLOBAL_SETTINGS', payload: { compositionName: val } })}
        />
        <NumberInput
          label="Duration (frames)"
          value={state.durationInFrames}
          onChange={(val) => dispatch({ type: 'UPDATE_GLOBAL_SETTINGS', payload: { durationInFrames: val } })}
          min={1}
        />
        <NumberInput
          label="FPS"
          value={state.fps}
          onChange={(val) => dispatch({ type: 'UPDATE_GLOBAL_SETTINGS', payload: { fps: val } })}
          min={1}
        />
        <NumberInput
          label="Width (px)"
          value={state.width}
          onChange={(val) => dispatch({ type: 'UPDATE_GLOBAL_SETTINGS', payload: { width: val } })}
          min={1}
        />
        <NumberInput
          label="Height (px)"
          value={state.height}
          onChange={(val) => dispatch({ type: 'UPDATE_GLOBAL_SETTINGS', payload: { height: val } })}
          min={1}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption">Background Color:</Typography>
          <input
            type="color"
            value={state.backgroundColor}
            onChange={(e) => dispatch({ type: 'UPDATE_GLOBAL_SETTINGS', payload: { backgroundColor: e.target.value } })}
            style={{ marginLeft: '8px' }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
};

// --- Camera Panel ---
export const CameraPanel: React.FC = () => {
  const { state, dispatch } = useContext(ParallaxEditorContext);
  const { camera } = state;

  const handleChange = (key: keyof typeof camera, value: number) => {
    dispatch({ type: 'UPDATE_CAMERA_CONFIG', payload: { [key]: value } });
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>Camera</Typography>
      <Stack spacing={2}>
        <Typography variant="subtitle2">Initial State</Typography>
        <NumberInput label="Initial X" value={camera.initialX} onChange={(v) => handleChange('initialX', v)} step={10} />
        <NumberInput label="Initial Y" value={camera.initialY} onChange={(v) => handleChange('initialY', v)} step={10} />
        <SliderInput label="Initial Zoom" value={camera.initialZoom} onChange={(v) => handleChange('initialZoom', v)} min={0.1} max={5} step={0.01} />

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2">Final State</Typography>
        <NumberInput label="Final X" value={camera.finalX} onChange={(v) => handleChange('finalX', v)} step={10} />
        <NumberInput label="Final Y" value={camera.finalY} onChange={(v) => handleChange('finalY', v)} step={10} />
        <SliderInput label="Final Zoom" value={camera.finalZoom} onChange={(v) => handleChange('finalZoom', v)} min={0.1} max={5} step={0.01} />
      </Stack>
    </Paper>
  );
};

// --- Layer Panel ---
export const LayerPanel: React.FC = () => {
  const { state, dispatch } = useContext(ParallaxEditorContext);
  const { layers, selectedLayerId } = state;

  const handleAddLayer = () => dispatch({ type: 'ADD_LAYER' });
  const handleSelectLayer = (id: string) => dispatch({ type: 'SELECT_LAYER', payload: { layerId: id } });
  const handleRemoveLayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_LAYER', payload: { layerId: id } });
  };

  const handleMoveLayer = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < layers.length) {
      dispatch({ type: 'REORDER_LAYERS', payload: { oldIndex: index, newIndex } });
    }
  };


  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Layers</Typography>
        <Button startIcon={<AddIcon />} onClick={handleAddLayer} variant="contained" size="small">
          Add Layer
        </Button>
      </Stack>
      <List dense>
        {layers.map((layer, index) => (
          <ListItem key={layer.id} disablePadding>
            <ListItemButton
              selected={layer.id === selectedLayerId}
              onClick={() => handleSelectLayer(layer.id)}
            >
              <ListItemText primary={`${layer.name} (Z: ${layer.zIndex})`} />
            </ListItemButton>
            <ListItemSecondaryAction>
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={() => handleMoveLayer(index, 'up')} disabled={index === 0}>
                  <ArrowUpward fontSize="inherit" />
                </IconButton>
                <IconButton size="small" onClick={() => handleMoveLayer(index, 'down')} disabled={index === layers.length - 1}>
                  <ArrowDownward fontSize="inherit" />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={(e) => handleRemoveLayer(layer.id, e)} size="small">
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </Stack>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      {selectedLayer && (
        <Box mt={2} p={2} border={1} borderColor="divider" borderRadius={1}>
          <Typography variant="subtitle1" gutterBottom>Edit: {selectedLayer.name}</Typography>
          <Stack spacing={2}>
            <TextInput
              label="Name"
              value={selectedLayer.name}
              onChange={(val) => dispatch({ type: 'UPDATE_LAYER_PROPERTIES', payload: { layerId: selectedLayer.id, properties: { name: val } } })}
            />
            <NumberInput
              label="Parallax X"
              value={selectedLayer.parallaxFactor.x}
              onChange={(val) => dispatch({ type: 'UPDATE_LAYER_PROPERTIES', payload: { layerId: selectedLayer.id, properties: { parallaxFactor: { ...selectedLayer.parallaxFactor, x: val } } } })}
              step={0.01}
            />
            <NumberInput
              label="Parallax Y"
              value={selectedLayer.parallaxFactor.y}
              onChange={(val) => dispatch({ type: 'UPDATE_LAYER_PROPERTIES', payload: { layerId: selectedLayer.id, properties: { parallaxFactor: { ...selectedLayer.parallaxFactor, y: val } } } })}
              step={0.01}
            />
            <NumberInput
              label="Z-Index (manual)"
              value={selectedLayer.zIndex}
              onChange={(val) => dispatch({ type: 'UPDATE_LAYER_PROPERTIES', payload: { layerId: selectedLayer.id, properties: { zIndex: val } } })}
              step={1}
            />
            <SwitchInput
              label="Visible"
              checked={selectedLayer.isVisible}
              onChange={(val) => dispatch({ type: 'UPDATE_LAYER_PROPERTIES', payload: { layerId: selectedLayer.id, properties: { isVisible: val } } })}
            />
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

// --- Element Panel (for adding and editing SVGs) ---
export const ElementPanel: React.FC = () => {
  const { state, dispatch } = useContext(ParallaxEditorContext);
  const { layers, selectedLayerId, selectedElementId } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const selectedElement = selectedLayer?.elements.find(el => el.id === selectedElementId);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedLayerId) {
      alert("Please select a layer first!");
      return;
    }
    
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Process each selected SVG file
    Array.from(files).forEach(file => {
      if (file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const svgString = e.target?.result as string;
          let width = 100;
          let height = 100;
          const widthMatch = svgString.match(/width="([^"]+)"/);
          const heightMatch = svgString.match(/height="([^"]+)"/);
          if (widthMatch?.[1]) width = parseFloat(widthMatch[1]);
          if (heightMatch?.[1]) height = parseFloat(heightMatch[1]);

          // Ensure base properties are set for Omit to work correctly
          const newElementBase: Omit<SVGElementData, 'id' | 'initialRotation' | 'finalRotation' | 'transformOriginX' | 'transformOriginY' | 'rotationAnimationType' | 'zIndex'> & Partial<Pick<SVGElementData, 'initialRotation' | 'finalRotation' | 'transformOriginX' | 'transformOriginY' | 'rotationAnimationType' | 'zIndex'>> = {
            name: file.name,
            svgString,
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            width,
            height,
          };
          dispatch({ type: 'ADD_ELEMENT_TO_LAYER', payload: { layerId: selectedLayerId, element: newElementBase as Omit<SVGElementData, 'id'> } });
        };
        reader.readAsText(file);
      } else {
        console.warn(`File ${file.name} is not an SVG and was skipped.`);
      }
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectElement = (id: string) => dispatch({ type: 'SELECT_ELEMENT', payload: { elementId: id } });
  const handleRemoveElement = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedLayerId) {
      dispatch({ type: 'REMOVE_ELEMENT', payload: { layerId: selectedLayerId, elementId } });
    }
  };

  const handlePropertyChange = (propName: keyof SVGElementData, value: any) => {
    if (selectedLayer && selectedElement) {
      dispatch({
        type: 'UPDATE_ELEMENT_PROPERTIES',
        payload: {
          layerId: selectedLayer.id,
          elementId: selectedElement.id,
          properties: { [propName]: value }
        }
      });
    }
  };


  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Elements</Typography>
        <Button
          variant="contained"
          size="small"
          component="label"
          startIcon={<AddIcon />}
          disabled={!selectedLayerId}
        >
          Add SVG
          <input type="file" hidden accept=".svg" onChange={handleFileChange} ref={fileInputRef} multiple />
        </Button>
      </Stack>
      {!selectedLayerId && <Typography variant="caption">Select a layer to add or manage elements.</Typography>}
      {selectedLayer && (
        <>
          <List dense sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
            {[...(selectedLayer.elements || [])]
              .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
              .map(el => (
                <ListItem
                  key={el.id}
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(e) => handleRemoveElement(el.id, e)}
                      size="small"
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    selected={el.id === selectedElementId}
                    onClick={() => handleSelectElement(el.id)}
                  >
                    <SVGViewer
                      svgString={el.svgString}
                      width={24}
                      height={24}
                      style={{ marginRight: '8px' }}
                    />
                    <ListItemText
                      primary={`${el.name.length > 12 ? el.name.substring(0, 9) + '...' : el.name} (Z: ${el.zIndex === undefined ? 'N/A' : el.zIndex})`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
          {selectedElement && (
            <Box mt={2} p={2} border={1} borderColor="divider" borderRadius={1} sx={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
              <Typography variant="subtitle1" gutterBottom>Edit: {selectedElement.name}</Typography>
              <Stack spacing={2}>
                <TextInput
                  label="Name"
                  value={selectedElement.name}
                  onChange={(val) => handlePropertyChange('name', val)}
                />
                <NumberInput
                  label="X"
                  value={selectedElement.x}
                  onChange={(val) => handlePropertyChange('x', val)}
                  step={1}
                />
                <NumberInput
                  label="Y"
                  value={selectedElement.y}
                  onChange={(val) => handlePropertyChange('y', val)}
                  step={1}
                />
                <SliderInput
                  label="Scale"
                  value={selectedElement.scale}
                  onChange={(val) => handlePropertyChange('scale', val)}
                  min={0.01} max={10} step={0.01}
                />
                <SliderInput
                  label="Opacity"
                  value={selectedElement.opacity}
                  onChange={(val) => handlePropertyChange('opacity', val)}
                  min={0} max={1} step={0.01}
                />
                <Divider>Rotation & Transform</Divider>
                <NumberInput
                  label="Initial Rotation (°)"
                  value={selectedElement.initialRotation}
                  onChange={(val) => handlePropertyChange('initialRotation', val)}
                  step={1}
                />
                <NumberInput
                  label="Final Rotation (°)"
                  value={selectedElement.finalRotation}
                  onChange={(val) => handlePropertyChange('finalRotation', val)}
                  step={1}
                />
                <SliderInput
                  label="Transform Origin X (0-1)"
                  value={selectedElement.transformOriginX}
                  onChange={(val) => handlePropertyChange('transformOriginX', val)}
                  min={0} max={1} step={0.01}
                />
                <SliderInput
                  label="Transform Origin Y (0-1)"
                  value={selectedElement.transformOriginY}
                  onChange={(val) => handlePropertyChange('transformOriginY', val)}
                  min={0} max={1} step={0.01}
                />
                <FormControl fullWidth size="small">
                  <InputLabel id="rotation-anim-type-label">Rotation Animation</InputLabel>
                  <Select
                    labelId="rotation-anim-type-label"
                    label="Rotation Animation"
                    value={selectedElement.rotationAnimationType}
                    onChange={(e) => handlePropertyChange('rotationAnimationType', e.target.value as AnimationType)}
                  >
                    <MenuItem value="easing">Easing</MenuItem>
                    <MenuItem value="spring">Spring</MenuItem>
                  </Select>
                </FormControl>
                <Divider>Layering</Divider>
                <NumberInput
                  label="Z-Index (within layer)"
                  value={selectedElement.zIndex}
                  onChange={(val) => handlePropertyChange('zIndex', val)}
                  step={1}
                />
              </Stack>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};