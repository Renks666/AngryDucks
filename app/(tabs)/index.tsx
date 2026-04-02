import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Wallet, Monitor, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { fetchUpcomingGames, fetchRegistrations } from '@/lib/gamesApi';
import { fetchMyBalance, fetchClubBalance } from '@/lib/transactionsApi';
import { Game } from '@/lib/types';

function formatBalance(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('ru-RU');
  return amount >= 0 ? `${abs} ₽` : `−${abs} ₽`;
}

function formatGameDate(dateStr: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${dateStr}T12:00:00`));
}

export default function DashboardScreen() {
  useTheme();
  const { profile, isAdmin } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [nextGame, setNextGame] = useState<Game | null | undefined>(undefined);
  const [nextGameCount, setNextGameCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    const balancePromise = isAdmin
      ? fetchClubBalance()
      : fetchMyBalance(profile.id);

    balancePromise.then(setBalance).catch(() => setBalance(null));

    fetchUpcomingGames()
      .then(async (games) => {
        if (games.length === 0) {
          setNextGame(null);
          return;
        }
        const game = games[0];
        setNextGame(game);
        const regs = await fetchRegistrations(game.id);
        setNextGameCount(regs.length);
      })
      .catch(() => setNextGame(null));
  }, [profile, isAdmin]);

  return (
    <ScreenBackground overlayOpacity={0.60}>
      <SafeAreaView style={styles.safe} edges={Platform.OS === 'web' ? [] : ['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoSmall}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandBlock}>
              <Text style={styles.headerTitle}>ANGRY DUCKS</Text>
              <Text style={styles.headerTagline}>FOOTBALL CLUB</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.balanceBadge}
            onPress={() => router.push('/(tabs)/treasury')}
          >
            <Wallet size={Platform.OS === 'web' ? 15 : 13} color="#0B0B0D" strokeWidth={2.5} />
            <Text style={styles.balanceBadgeText}>
              {balance !== null ? formatBalance(balance) : '— ₽'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerDivider} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Subscription banner */}
          <Animated.View entering={FadeInDown.delay(60).springify().damping(18)}>
            <TouchableOpacity
              style={styles.subBanner}
              activeOpacity={0.82}
              onPress={() => router.push('/subscription/current' as any)}
            >
              <View style={styles.subBannerLeft}>
                <View style={styles.subIconWrap}>
                  <Monitor size={18} color="#F4A300" strokeWidth={1.8} />
                </View>
                <View>
                  <Text style={styles.subBannerTitle}>Абонемент на апрель</Text>
                  <Text style={styles.subBannerSub}>Запись открыта</Text>
                </View>
              </View>
              <View style={styles.subBannerCta}>
                <Text style={styles.subBannerCtaText}>Записаться</Text>
                <ChevronRight size={14} color="#C1121F" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Section title */}
          <Text style={styles.sectionTitle}>Ближайшие игры</Text>

          {/* Next game card */}
          {nextGame === undefined ? (
            <CardSkeleton style={styles.cardSpacing} />
          ) : nextGame === null ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Нет запланированных игр</Text>
            </View>
          ) : (
            <Animated.View
              entering={FadeInDown.delay(120).springify().damping(18)}
              style={styles.cardSpacing}
            >
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push(`/game/${nextGame.id}` as any)}
              >
                <View style={styles.gameCard}>
                  {/* Top row: price */}
                  {nextGame.price_rub != null && (
                    <View style={styles.gameCardTop}>
                      <Text style={styles.gamePrice}>
                        {nextGame.price_rub.toLocaleString('ru-RU')} ₽
                      </Text>
                    </View>
                  )}

                  {/* Time */}
                  <Text style={styles.gameTime}>{nextGame.time.slice(0, 5)}</Text>

                  {/* Date + location */}
                  <Text style={styles.gameLocation} numberOfLines={1}>
                    {formatGameDate(nextGame.date)} • {nextGame.location}
                  </Text>

                  {/* Participants */}
                  <View style={styles.participantsSection}>
                    <View style={styles.participantsRow}>
                      <Text style={styles.participantsLabel}>УЧАСТНИКИ</Text>
                      <Text style={styles.participantsCount}>{nextGameCount} чел.</Text>
                    </View>
                  </View>

                  {/* CTA button */}
                  <TouchableOpacity
                    style={styles.participateBtn}
                    onPress={() => router.push(`/game/${nextGame.id}` as any)}
                  >
                    <Text style={styles.participateBtnText}>Участвовать</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.OS === 'web' ? 14 : 10,
  },
  logoWrap: {
    width: Platform.OS === 'web' ? 52 : 36,
    height: Platform.OS === 'web' ? 52 : 36,
    borderRadius: Platform.OS === 'web' ? 14 : 10,
    borderWidth: 1.5,
    borderColor: 'rgba(193,18,31,0.55)',
    shadowColor: '#C1121F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: Platform.OS === 'web' ? 12 : 6,
    elevation: 4,
    overflow: 'hidden',
  },
  logoSmall: {
    width: '100%' as any,
    height: '100%' as any,
  },
  brandBlock: {
    gap: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 22 : 17,
    fontWeight: '800',
    letterSpacing: Platform.OS === 'web' ? 2.5 : 1.0,
  },
  headerTagline: {
    color: '#F4A300',
    fontSize: Platform.OS === 'web' ? 10 : 9,
    fontWeight: '700',
    letterSpacing: Platform.OS === 'web' ? 3.5 : 2.5,
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(193,18,31,0.20)',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4A300',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  balanceBadgeText: {
    color: '#0B0B0D',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  // Subscription banner
  subBanner: {
    backgroundColor: 'rgba(11,11,13,0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(244,163,0,0.25)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  subBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(244,163,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subBannerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  subBannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(193,18,31,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(193,18,31,0.3)',
  },
  subBannerCtaText: {
    color: '#FF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  // Section
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  // Game card
  cardSpacing: { marginBottom: 16 },
  emptyCard: {
    backgroundColor: 'rgba(11,11,13,0.6)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 15,
  },
  gameCard: {
    backgroundColor: 'rgba(21,23,26,0.88)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(193,18,31,0.20)',
  },
  gameCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formatBadge: {
    backgroundColor: 'rgba(193,18,31,0.18)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(193,18,31,0.35)',
  },
  formatBadgeText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gamePrice: {
    color: '#F4A300',
    fontSize: 16,
    fontWeight: '700',
  },
  gameTime: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  gameLocation: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginBottom: 16,
  },
  participantsSection: {
    marginBottom: 14,
  },
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantsLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  participantsCount: {
    color: '#30D158',
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#30D158',
    borderRadius: 3,
  },
  participateBtn: {
    backgroundColor: '#C1121F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#C1121F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  participateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
