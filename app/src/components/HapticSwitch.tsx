import React from 'react';
import { Switch, SwitchProps } from 'react-native';
import { hapticTap } from '../utils/haptics';

export function HapticSwitch({ onValueChange, ...rest }: SwitchProps) {
  const handleValueChange = onValueChange
    ? (value: boolean) => {
        hapticTap();
        onValueChange(value);
      }
    : undefined;

  return <Switch {...rest} onValueChange={handleValueChange} />;
}
