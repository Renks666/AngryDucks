import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Duck Team',
  slug: 'duck-team',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/logo.png',
  scheme: 'duckteam',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/logo.png',
    resizeMode: 'contain',
    backgroundColor: '#1A1A1A',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.duckteam.app',
    infoPlist: {
      NSCameraUsageDescription: 'Used to set your profile photo.',
      NSPhotoLibraryUsageDescription: 'Used to select your profile photo.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/logo.png',
      backgroundColor: '#1A1A1A',
    },
    package: 'com.duckteam.app',
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/logo.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#1A1A1A',
        image: './assets/logo.png',
        imageWidth: 200,
        dark: {
          backgroundColor: '#1A1A1A',
          image: './assets/logo.png',
        },
      },
    ],
    [
      'expo-system-ui',
      {
        userInterfaceStyle: 'automatic',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
