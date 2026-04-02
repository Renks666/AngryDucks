import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, RefreshCw, AlertCircle, UserCheck } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import {
  fetchActiveSubscription,
  fetchSubscriptionDetail,
  joinSubscription,
  leaveSubscription,
} from '@/lib/subscriptionsApi';
import { Subscription, SubscriptionMember } from '@/lib/types';

const MONTH_ABBR = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
];

const MONTH_FULL = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function formatMoney(amount: number): string {
  return amount.toLocaleString('ru-RU') + ' ₽';
}

export default function SubscriptionScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const { profile, isAdmin } = useAuth();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [members, setMembers] = useState<SubscriptionMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const resolveAndLoad = useCallback(async () => {
    try {
      setError('');
      let subId = rawId;
      // 'current' is a special alias → fetch active subscription
      if (rawId === 'current') {
        const active = await fetchActiveSubscription();
        if (!active) {
          setSubscription(null);
          setMembers([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }
        subId = active.id;
      }
      const { subscription: sub, members: mem } = await fetchSubscriptionDetail(subId);
      setSubscription(sub);
      setMembers(mem);
    } catch (e: any) {
      setError(e.message ?? 'Ошибка загрузки');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rawId]);

  useEffect(() => { resolveAndLoad(); }, [resolveAndLoad]);

  const isJoined = !!profile && members.some((m) => m.player_id === profile.id);

  const handleToggle = async () => {
    if (!subscription) return;
    setJoining(true);
    try {
      if (isJoined) {
        await leaveSubscription(subscription.id);
      } else {
        await joinSubscription(subscription.id);
      }
      await resolveAndLoad();
    } catch (e: any) {
      setError(e.message ?? 'Ошибка');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={Platform.OS === 'web' ? [] : ['top']}>
          <View style={styles.loadingCenter}>
            <ActivityIndicator color="#C1121F" size="large" />
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  if (!subscription) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={Platform.OS === 'web' ? [] : ['top']}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={styles.loadingCenter}>
            <Text style={styles.emptyTitle}>Нет активного абонемента</Text>
            <Text style={styles.emptySubtitle}>Обратитесь к администратору</Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const monthDate = new Date(subscription.month + 'T12:00:00');
  const monthIndex = monthDate.getMonth();
  const day = monthDate.getDate();
  const monthAbbr = MONTH_ABBR[monthIndex];
  const monthFull = MONTH_FULL[monthIndex];
  const year = monthDate.getFullYear();

  const memberCount = members.length;
  const costPerPerson = memberCount > 0
    ? Math.round((subscription.rent_cost - subscription.bank_compensation) / memberCount)
    : 0;
  const costWithoutCompensation = memberCount > 0
    ? Math.round(subscription.rent_cost / memberCount)
    : 0;

  return (
    <ScreenBackground overlayOpacity={0.65}>
      <SafeAreaView style={styles.safe} edges={Platform.OS === 'web' ? [] : ['top']}>
        {/* Nav bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>Абонемент</Text>
            <Text style={styles.navSubtitle}>ФК «Утиное Яблоко»</Text>
          </View>
          <TouchableOpacity onPress={resolveAndLoad} style={styles.backBtn}>
            <RefreshCw size={20} color="rgba(255,255,255,0.6)" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); resolveAndLoad(); }}
              tintColor="#C1121F"
            />
          }
        >
          {/* Month badge */}
          <Animated.View entering={FadeInDown.delay(60).springify().damping(18)} style={styles.badgeRow}>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeAbbr}>{monthAbbr}</Text>
              <Text style={styles.monthBadgeDay}>{day}</Text>
            </View>
          </Animated.View>

          {/* Status */}
          <Animated.View entering={FadeInDown.delay(80).springify().damping(18)}>
            <View style={styles.card}>
              <View style={styles.statusRow}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: subscription.status === 'open' ? '#30D158' : '#8E8E93' },
                ]} />
                <Text style={styles.statusText}>
                  {subscription.status === 'open' ? 'Запись открыта' : 'Запись закрыта'}
                </Text>
                <Text style={styles.statusPeriod}>{monthFull} {year}</Text>
              </View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{memberCount} чел.</Text>
                  <Text style={styles.statLabel}>Записалось</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatMoney(subscription.rent_cost)}</Text>
                  <Text style={styles.statLabel}>Аренда</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{memberCount > 0 ? formatMoney(costPerPerson) : '—'}</Text>
                  <Text style={styles.statLabel}>≈ Оценка</Text>
                </View>
              </View>

              {/* Compensation block */}
              {subscription.bank_compensation > 0 && (
                <View style={styles.compensationCard}>
                  <View style={styles.compensationHeader}>
                    <Text style={styles.compensationTitle}>Компенсация из банка</Text>
                    <Text style={styles.compensationAmount}>
                      {formatMoney(subscription.bank_compensation)}
                    </Text>
                  </View>
                  <View style={styles.compensationDetails}>
                    <Text style={styles.compensationOld}>
                      Без компенсации: {memberCount > 0 ? formatMoney(costWithoutCompensation) : '—'}
                    </Text>
                    <Text style={styles.compensationNew}>
                      С компенсацией: {memberCount > 0 ? formatMoney(costPerPerson) : '—'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Warning */}
              <View style={styles.warningRow}>
                <AlertCircle size={14} color="#F4A300" strokeWidth={2} />
                <Text style={styles.warningText}>
                  Финальная стоимость рассчитывается 25-го числа
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* CTA button */}
          {subscription.status === 'open' && (
            <Animated.View entering={FadeInDown.delay(140).springify().damping(18)}>
              <TouchableOpacity
                style={[styles.ctaBtn, isJoined && styles.ctaBtnLeave]}
                onPress={handleToggle}
                disabled={joining}
                activeOpacity={0.82}
              >
                {joining ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : isJoined ? (
                  <View style={styles.ctaInner}>
                    <UserCheck size={18} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.ctaBtnText}>Вы записаны — выйти</Text>
                  </View>
                ) : (
                  <Text style={styles.ctaBtnText}>Записаться на абонемент</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Members list */}
          <Animated.View entering={FadeInDown.delay(180).springify().damping(18)}>
            <View style={styles.membersHeader}>
              <Text style={styles.membersTitle}>Записавшиеся</Text>
              <View style={styles.membersBadge}>
                <Text style={styles.membersBadgeText}>{memberCount} чел.</Text>
              </View>
            </View>

            {members.length === 0 ? (
              <View style={styles.emptyMembers}>
                <Text style={styles.emptyMembersText}>Никто ещё не записался</Text>
              </View>
            ) : (
              members.map((m, i) => (
                <View key={m.id} style={styles.memberRow}>
                  <View style={styles.memberNumber}>
                    <Text style={styles.memberNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.memberName}>
                    {m.profile?.name ?? 'Игрок'}
                  </Text>
                  <View style={styles.memberStatusBadge}>
                    <Text style={styles.memberStatusText}>Записан</Text>
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  navSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  badgeRow: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  monthBadge: {
    backgroundColor: '#C1121F',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#C1121F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  monthBadgeAbbr: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  monthBadgeDay: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: 'rgba(11,11,13,0.80)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
    gap: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statusPeriod: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  compensationCard: {
    backgroundColor: 'rgba(0,204,163,0.10)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,204,163,0.25)',
    gap: 8,
  },
  compensationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compensationTitle: {
    color: '#00CCA3',
    fontSize: 14,
    fontWeight: '600',
  },
  compensationAmount: {
    color: '#00CCA3',
    fontSize: 15,
    fontWeight: '700',
  },
  compensationDetails: {
    gap: 4,
  },
  compensationOld: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  compensationNew: {
    color: '#00CCA3',
    fontSize: 13,
    fontWeight: '600',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244,163,0,0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(244,163,0,0.20)',
  },
  warningText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    flex: 1,
  },
  errorBox: {
    backgroundColor: 'rgba(193,18,31,0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(193,18,31,0.30)',
  },
  errorText: {
    color: '#FF6B7A',
    fontSize: 14,
  },
  ctaBtn: {
    backgroundColor: '#C1121F',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#C1121F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnLeave: {
    backgroundColor: 'rgba(193,18,31,0.35)',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  membersTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  membersBadge: {
    backgroundColor: '#C1121F',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  membersBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyMembers: {
    backgroundColor: 'rgba(11,11,13,0.6)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyMembersText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11,11,13,0.70)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  memberNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C1121F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  memberStatusBadge: {
    backgroundColor: 'rgba(48,209,88,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.3)',
  },
  memberStatusText: {
    color: '#30D158',
    fontSize: 12,
    fontWeight: '600',
  },
});
