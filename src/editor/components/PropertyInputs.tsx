// src/editor/components/PropertyInputs.tsx
import React from 'react';
import { TextField, Stack, Typography, Slider, Switch } from '@mui/material';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, min, max, step }) => (
  <TextField
    label={label}
    type="number"
    value={value}
    onChange={(e) => onChange(parseFloat(e.target.value))}
    inputProps={{ min, max, step }}
    variant="outlined"
    size="small"
    fullWidth
  />
);

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}
export const TextInput: React.FC<TextInputProps> = ({ label, value, onChange }) => (
  <TextField
    label={label}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    variant="outlined"
    size="small"
    fullWidth
  />
);


interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

export const SliderInput: React.FC<SliderInputProps> = ({ label, value, onChange, min, max, step }) => (
  <Stack spacing={1}>
    <Typography gutterBottom variant="caption">{label}: {value.toFixed(2)}</Typography>
    <Slider
      value={value}
      onChange={(_, newValue) => onChange(newValue as number)}
      min={min}
      max={max}
      step={step}
      size="small"
    />
  </Stack>
);

interface SwitchInputProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const SwitchInput: React.FC<SwitchInputProps> = ({ label, checked, onChange }) => (
    <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption">{label}</Typography>
        <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} size="small" />
    </Stack>
);