// src/main.tsx (or your entry point)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'; // Assuming MUI
import { ParallaxEditorProvider } from './editor/context/ParallaxEditorContext';
import { ParallaxEditorView } from './editor/ParallaxEditorView';

// Basic MUI theme (or your existing theme setup)
const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const rootElement = document.getElementById('app');
if (!rootElement) throw new Error("Failed to find the root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}> {/* If using MUI */}
      <CssBaseline /> {/* If using MUI */}
      <ParallaxEditorProvider>
        <ParallaxEditorView />
      </ParallaxEditorProvider>
    </ThemeProvider>
  </React.StrictMode>
);