import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="game/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="admin" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="subscription/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

function AppContent() {
  const scheme = useColorScheme();

  // Load Inter only on Android (iOS uses SF Pro, Web uses Google Fonts via +html.tsx)
  // Load Inter on Android and Web (iOS uses SF Pro natively)
  const needsFonts = Platform.OS !== 'ios';
  const [fontsLoaded, fontError] = useFonts(
    needsFonts
      ? {
          'Inter-Regular':  Inter_400Regular,
          'Inter-Medium':   Inter_500Medium,
          'Inter-SemiBold': Inter_600SemiBold,
          'Inter-Bold':     Inter_700Bold,
        }
      : {}
  );

  const ready = !needsFonts || fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
