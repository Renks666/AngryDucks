import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input({
  label,
  error,
  containerStyle,
  rightIcon,
  secureTextEntry,
  style,
  ...props
}, ref) {
  const { colors, isDark } = useTheme();
  const [secure, setSecure] = useState(secureTextEntry ?? false);
  const [focused, setFocused] = useState(false);

  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : colors.backgroundSecondary;
  const borderColor = focused
    ? isDark ? 'rgba(196,30,58,0.70)' : colors.brand
    : isDark ? 'rgba(255,255,255,0.10)' : 'transparent';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: isDark ? 'rgba(255,255,255,0.45)' : colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: inputBg,
            borderColor,
            borderWidth: 1.5,
          },
        ]}
      >
        <TextInput
          {...props}
          ref={ref}
          secureTextEntry={secure}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.30)' : colors.textTertiary}
          style={[
            styles.input,
            { color: colors.text },
            style,
          ]}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setSecure(!secure)} style={styles.iconBtn}>
            {secure
              ? <Eye size={20} color={colors.textSecondary} />
              : <EyeOff size={20} color={colors.textSecondary} />
            }
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <View style={styles.iconBtn}>{rightIcon}</View>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 13,
  },
  iconBtn: {
    padding: 4,
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 2,
  },
});
