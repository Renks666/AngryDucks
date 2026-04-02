import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

interface RowProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  showSeparator?: boolean;
  style?: ViewStyle;
}

export function Row({
  title,
  subtitle,
  leftIcon,
  rightElement,
  chevron = false,
  onPress,
  destructive = false,
  showSeparator = true,
  style,
}: RowProps) {
  const { colors } = useTheme();
  const haptics = useHaptics();

  const handlePress = () => {
    haptics.light();
    onPress?.();
  };

  const content = (
    <View style={[styles.row, style]}>
      {leftIcon ? (
        <View style={styles.leftIcon}>{leftIcon}</View>
      ) : null}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: destructive ? colors.danger : colors.text },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
      {chevron ? (
        <ChevronRight size={16} color={colors.textTertiary} style={styles.chevron} />
      ) : null}
    </View>
  );

  return (
    <>
      {onPress ? (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.65}>
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
      {showSeparator ? (
        <View
          style={[
            styles.separator,
            {
              backgroundColor: colors.separator,
              marginLeft: leftIcon ? 56 : 16,
            },
          ]}
        />
      ) : null}
    </>
  );
}

// Section wrapper
interface SectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Section({ title, children, style }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, style]}>
      {title ? (
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={[
          styles.sectionBody,
          {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  leftIcon: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  right: {
    marginLeft: 8,
  },
  chevron: {
    marginLeft: 4,
    opacity: 0.5,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionBody: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
