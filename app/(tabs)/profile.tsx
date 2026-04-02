import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Shield, Info, Pencil } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Row, Section } from '@/components/ui/Row';
import { Button } from '@/components/ui/Button';
import { EditProfileSheet } from '@/components/profile/EditProfileSheet';
import { fetchMyStats } from '@/lib/profileApi';
import { Profile } from '@/lib/types';

const ROLE_LABELS = { admin: 'Администратор', player: 'Игрок', guest: 'Гость' };
const SKILL_LABELS = { amateur: 'Любитель', medium: 'Средний', pro: 'Про' };

const SKILL_COLORS: Record<string, [string, string]> = {
  amateur: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)'],
  medium:  ['rgba(255,149,0,0.35)',   'rgba(255,149,0,0.2)'],
  pro:     ['rgba(52,199,89,0.35)',   'rgba(52,199,89,0.2)'],
};

export default function ProfileScreen() {
  const { colors, shadows } = useTheme();
  const { profile: authProfile, signOut, isAdmin, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(authProfile);
  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    setProfile(authProfile);
  }, [authProfile]);

  useEffect(() => {
    if (!authProfile) return;
    fetchMyStats(authProfile.id)
      .then((s) => setGamesPlayed(s.gamesPlayed))
      .catch(() => {});
  }, [authProfile]);

  if (!profile) return null;

  function handleProfileSaved(updated: Profile) {
    setProfile(updated);
    refreshProfile();
  }

  const skillGrad = SKILL_COLORS[profile.skill_level] ?? SKILL_COLORS.amateur;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={Platform.OS === 'web' ? [] : ['top']}
    >
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Text style={[styles.largeTitle, { color: colors.text }]}>Профиль</Text>
        <TouchableOpacity
          onPress={() => setShowEdit(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Pencil size={20} color={colors.brand} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient profile hero card */}
        <Animated.View
          entering={FadeInDown.delay(60).springify().damping(18)}
          style={[styles.heroCard, shadows.brand]}
        >
          <LinearGradient
            colors={['#8B1A2B', '#4A0E15']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Avatar with white ring */}
          <View style={styles.avatarRing}>
            <Avatar name={profile.name} uri={profile.avatar_url} size="xl" />
          </View>

          {/* Name & phone */}
          <Text style={styles.heroName}>{profile.name}</Text>
          {profile.phone ? (
            <Text style={styles.heroPhone}>{profile.phone}</Text>
          ) : null}

          {/* Badges row */}
          <View style={styles.badgeRow}>
            {/* Skill badge */}
            <LinearGradient
              colors={skillGrad}
              style={styles.skillPill}
            >
              <Text style={styles.skillPillText}>{SKILL_LABELS[profile.skill_level]}</Text>
            </LinearGradient>

            {isAdmin && (
              <View style={styles.adminPill}>
                <Text style={styles.adminPillText}>Admin</Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {gamesPlayed === null ? '—' : String(gamesPlayed)}
              </Text>
              <Text style={styles.statLabel}>Игр</Text>
            </View>
          </View>
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeInDown.delay(120).springify().damping(18)}>
          <Section title="Аккаунт">
            <Row
              title="Роль"
              rightElement={
                <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                  {ROLE_LABELS[profile.role]}
                </Text>
              }
            />
            <Row
              title="Уровень игры"
              rightElement={
                <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                  {SKILL_LABELS[profile.skill_level]}
                </Text>
              }
              showSeparator={false}
            />
          </Section>
        </Animated.View>

        {/* Admin panel */}
        {isAdmin && (
          <Animated.View entering={FadeInDown.delay(160).springify().damping(18)}>
            <Section title="Управление">
              <Row
                title="Админ-панель"
                leftIcon={<Shield size={20} color={colors.brand} />}
                chevron
                onPress={() => router.push('/admin' as any)}
                showSeparator={false}
              />
            </Section>
          </Animated.View>
        )}

        {/* App info */}
        <Animated.View entering={FadeInDown.delay(200).springify().damping(18)}>
          <Section title="Приложение">
            <Row
              title="О приложении"
              subtitle="Duck Team v1.0"
              leftIcon={<Info size={20} color={colors.textSecondary} />}
              chevron
              showSeparator={false}
            />
          </Section>
        </Animated.View>

        <Button
          label="Выйти"
          onPress={signOut}
          variant="destructive"
          style={styles.logoutBtn}
        />
      </ScrollView>

      <EditProfileSheet
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        onSaved={handleProfileSaved}
        profile={profile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.37,
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 110,
  },
  // Hero card
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  avatarRing: {
    borderRadius: 100,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    marginBottom: 14,
    padding: 2,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroPhone: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  skillPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  skillPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  adminPill: {
    backgroundColor: 'rgba(245, 230, 211, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 211, 0.35)',
  },
  adminPillText: {
    color: '#F5E6D3',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 16,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statNum: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 15,
  },
  logoutBtn: {
    marginTop: 8,
  },
});
