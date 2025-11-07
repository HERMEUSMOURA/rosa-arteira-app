import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeArea } from '../hooks/useSafeArea';

interface SafeAreaViewProps {
  children: React.ReactNode;
  style?: any;
}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({ children, style }) => {
  const { bottomSafeArea } = useSafeArea();

  return (
    <View style={[styles.container, { paddingBottom: bottomSafeArea }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});