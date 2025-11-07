import { useEffect, useState } from 'react';
import { Platform, Dimensions } from 'react-native';

export const useSafeArea = () => {
  const [bottomSafeArea, setBottomSafeArea] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Para Android com botões de navegação, adicionar margem extra
      const { height } = Dimensions.get('window');
      
      // Heurística: se a altura for menor que 700, provavelmente tem barra de navegação
      if (height < 700) {
        setBottomSafeArea(25);
      } else {
        setBottomSafeArea(15);
      }
    } else {
      // iOS já lida bem com safe areas
      setBottomSafeArea(0);
    }
  }, []);

  return {
    bottomSafeArea,
    hasAndroidNavigation: Platform.OS === 'android' && bottomSafeArea > 0
  };
};