import { Platform, useWindowDimensions } from 'react-native';

export interface PlatformInfo {
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktopWeb: boolean;
  isMobileWeb: boolean;
}

export function usePlatform(): PlatformInfo {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  return {
    isWeb,
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isDesktopWeb: isWeb && width > 768,
    isMobileWeb: isWeb && width <= 768,
  };
}
