// src/editor/context/ParallaxEditorContext.tsx
import React, { createContext, useReducer, Dispatch, ReactNode } from 'react';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { EditorState, LayerData, SVGElementData, CameraConfig, ParallaxConfig } from '../types';

type Action =
  | { type: 'SET_INITIAL_STATE'; payload: ParallaxConfig }
  | { type: 'UPDATE_GLOBAL_SETTINGS'; payload: Partial<Pick<EditorState, 'durationInFrames' | 'fps' | 'width' | 'height' | 'backgroundColor' | 'compositionName'>> }
  | { type: 'UPDATE_CAMERA_CONFIG'; payload: Partial<CameraConfig> }
  | { type: 'ADD_LAYER'; payload?: Partial<Omit<LayerData, 'id' | 'elements' | 'isVisible'>> }
  | { type: 'REMOVE_LAYER'; payload: { layerId: string } }
  | { type: 'UPDATE_LAYER_PROPERTIES'; payload: { layerId: string; properties: Partial<Omit<LayerData, 'id' | 'elements'>> } }
  | { type: 'SELECT_LAYER'; payload: { layerId: string | null } }
  | { type: 'ADD_ELEMENT_TO_LAYER'; payload: { layerId: string; element: Omit<SVGElementData, 'id'> } }
  | { type: 'REMOVE_ELEMENT'; payload: { layerId: string; elementId: string } }
  | { type: 'UPDATE_ELEMENT_PROPERTIES'; payload: { layerId: string; elementId: string; properties: Partial<Omit<SVGElementData, 'id'>> } }
  | { type: 'SELECT_ELEMENT'; payload: { elementId: string | null } }
  | { type: 'REORDER_LAYERS'; payload: { oldIndex: number; newIndex: number } }; // Basic reorder

const initialState: EditorState = {
  compositionName: 'MyParallaxVideo',
  durationInFrames: 300, // 10 seconds at 30fps
  fps: 30,
  width: 1920,
  height: 1080,
  backgroundColor: '#DDDDDD',
  camera: {
    initialX: 0,
    initialY: 0,
    initialZoom: 1,
    finalX: 0,
    finalY: 0,
    finalZoom: 1,
  },
  layers: [],
  selectedLayerId: null,
  selectedElementId: null,
};

const ParallaxEditorContext = createContext<{
  state: EditorState;
  dispatch: Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

const reducer = produce((draft: EditorState, action: Action) => {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return { ...initialState, ...action.payload, selectedLayerId: null, selectedElementId: null };
    case 'UPDATE_GLOBAL_SETTINGS':
      Object.assign(draft, action.payload);
      break;
    case 'UPDATE_CAMERA_CONFIG':
      draft.camera = { ...draft.camera, ...action.payload };
      break;
    case 'ADD_LAYER':
      const newLayer: LayerData = {
        id: uuidv4(),
        name: `Layer ${draft.layers.length + 1}`,
        parallaxFactor: { x: 0.5, y: 0.5 },
        zIndex: draft.layers.length,
        elements: [],
        isVisible: true,
        ...action.payload,
      };
      draft.layers.push(newLayer);
      draft.selectedLayerId = newLayer.id;
      break;
    case 'REMOVE_LAYER':
      draft.layers = draft.layers.filter(l => l.id !== action.payload.layerId);
      if (draft.selectedLayerId === action.payload.layerId) {
        draft.selectedLayerId = null;
        draft.selectedElementId = null;
      }
      break;
    case 'UPDATE_LAYER_PROPERTIES': {
      const layer = draft.layers.find(l => l.id === action.payload.layerId);
      if (layer) {
        Object.assign(layer, action.payload.properties);
      }
      break;
    }
    case 'SELECT_LAYER':
      draft.selectedLayerId = action.payload.layerId;
      draft.selectedElementId = null; // Deselect element when layer changes
      break;
    case 'ADD_ELEMENT_TO_LAYER': {
      const layer = draft.layers.find(l => l.id === action.payload.layerId);
      if (layer) {
        const newElement: SVGElementData = {
          id: uuidv4(),
          ...action.payload.element,
        };
        layer.elements.push(newElement);
        draft.selectedElementId = newElement.id;
      }
      break;
    }
    case 'REMOVE_ELEMENT': {
      const layer = draft.layers.find(l => l.id === action.payload.layerId);
      if (layer) {
        layer.elements = layer.elements.filter(el => el.id !== action.payload.elementId);
        if (draft.selectedElementId === action.payload.elementId) {
          draft.selectedElementId = null;
        }
      }
      break;
    }
    case 'UPDATE_ELEMENT_PROPERTIES': {
      const layer = draft.layers.find(l => l.id === action.payload.layerId);
      if (layer) {
        const element = layer.elements.find(el => el.id === action.payload.elementId);
        if (element) {
          Object.assign(element, action.payload.properties);
        }
      }
      break;
    }
    case 'SELECT_ELEMENT':
      draft.selectedElementId = action.payload.elementId;
      break;
    case 'REORDER_LAYERS': {
      // Basic array move for zIndex reordering (visual order in panel)
      const { oldIndex, newIndex } = action.payload;
      if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0 || oldIndex >= draft.layers.length || newIndex >= draft.layers.length) break;
      const [movedLayer] = draft.layers.splice(oldIndex, 1);
      draft.layers.splice(newIndex, 0, movedLayer);
      // Update zIndex based on new order (lower index = lower zIndex visually, but higher zIndex in CSS for stacking)
      draft.layers.forEach((layer, index) => {
        layer.zIndex = index;
      });
      break;
    }
    default:
      break;
  }
});

const ParallaxEditorProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <ParallaxEditorContext.Provider value={{ state, dispatch }}>
      {children}
    </ParallaxEditorContext.Provider>
  );
};

export { ParallaxEditorContext, ParallaxEditorProvider, initialState as defaultEditorState };