import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  Home,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const { colors } = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const tabBarBackground = () => {
    if (Platform.OS === 'web') return undefined;
    return (
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={{ flex: 1 }}
      />
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: Platform.OS === 'web' ? 0 : 0.5,
          borderTopColor: colors.tabBarBorder,
          backgroundColor: Platform.OS === 'web' ? colors.tabBar : 'transparent',
          elevation: 0,
          ...(Platform.OS === 'web' && {
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }),
        },
        tabBarBackground: Platform.OS !== 'web' ? tabBarBackground : undefined,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, focused }) => (
            <Home size={focused ? 26 : 24} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Игры',
          tabBarIcon: ({ color, focused }) => (
            <Calendar size={focused ? 26 : 24} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="treasury"
        options={{
          title: 'Казна',
          tabBarIcon: ({ color, focused }) => (
            <DollarSign size={focused ? 26 : 24} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, focused }) => (
            <User size={focused ? 26 : 24} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
    </Tabs>
  );
}
