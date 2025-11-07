import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

// COMPONENTES COM CORES FIXAS
export function ThemedViewLight({ style, ...otherProps }: ViewProps) {
  return <View style={[{ backgroundColor: '#FFFFFF' }, style]} {...otherProps} />;
}

export function ThemedViewDark({ style, ...otherProps }: ViewProps) {
  return <View style={[{ backgroundColor: '#000000' }, style]} {...otherProps} />;
}