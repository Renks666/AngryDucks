import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PRIMARY_GRADIENT: [string, string] = ['#A82236', '#6B1321'];

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 12, stiffness: 200 });
    opacity.value = withSpring(0.9, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 8, stiffness: 180 });
    opacity.value = withSpring(1, { damping: 8, stiffness: 180 });
  };

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  const heights: Record<Size, number> = { sm: 36, md: 44, lg: 50 };
  const fontSizes: Record<Size, number> = { sm: 15, md: 16, lg: 17 };
  const borderRadius = 14;

  const textColors: Record<Variant, string> = {
    primary:     '#FFFFFF',
    secondary:   colors.brand,
    destructive: colors.danger,
    ghost:       colors.textSecondary,
  };

  const commonTouchableStyle: ViewStyle = {
    height: heights[size],
    opacity: disabled ? 0.5 : 1,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    borderRadius,
    overflow: 'hidden',
  };

  const innerContent = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text
            style={[
              styles.label,
              {
                color: textColors[variant],
                fontSize: fontSizes[size],
                fontWeight: '600',
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          commonTouchableStyle,
          styles.brandShadow,
          animatedStyle,
          style,
        ]}
      >
        <LinearGradient
          colors={PRIMARY_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
        {innerContent}
      </AnimatedTouchable>
    );
  }

  const bgColors: Record<Variant, string> = {
    primary:     'transparent',
    secondary:   'transparent',
    destructive: 'transparent',
    ghost:       'transparent',
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[
        commonTouchableStyle,
        {
          backgroundColor: bgColors[variant],
          paddingHorizontal: fullWidth ? 0 : 20,
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          borderColor: variant === 'secondary' ? colors.brand : 'transparent',
        },
        animatedStyle,
        style,
      ]}
    >
      {innerContent}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    letterSpacing: -0.3,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandShadow: {
    shadowColor: '#A82236',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
});
