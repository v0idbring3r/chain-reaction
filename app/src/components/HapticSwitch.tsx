import React from 'react';
import { Switch, SwitchProps } from 'react-native';
import { hapticTap } from '../utils/haptics';
import { soundTap } from '../utils/sounds';

export function HapticSwitch({ onValueChange, ...rest }: SwitchProps) {
  const handleValueChange = onValueChange
    ? (value: boolean) => {
        hapticTap();
        soundTap();
        onValueChange(value);
      }
    : undefined;

  return <Switch {...rest} onValueChange={handleValueChange} />;
}
