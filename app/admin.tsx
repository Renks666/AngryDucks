import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Copy, Trash2, ExternalLink } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/ui/Avatar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { CardSkeleton, RowSkeleton } from '@/components/ui/SkeletonLoader';
import { Button } from '@/components/ui/Button';
import {
  fetchAllProfiles,
  updateProfileRole,
  updateProfileSkill,
  generateInviteCode,
  fetchActiveInviteCodes,
  deactivateInviteCode,
} from '@/lib/profileApi';
import {
  fetchActiveSubscription,
  fetchSubscriptionDetail,
  closeSubscription,
} from '@/lib/subscriptionsApi';
import { CreateSubscriptionSheet } from '@/components/admin/CreateSubscriptionSheet';
import { Profile, UserRole, SkillLevel, InviteCode, Subscription, SubscriptionMember } from '@/lib/types';

const ROLE_OPTIONS: UserRole[] = ['player', 'admin', 'guest'];
const ROLE_LABELS: Record<UserRole, string> = { admin: 'Admin', player: 'Player', guest: 'Guest' };
const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#8B1A2B',
  player: '#007AFF',
  guest: '#8E8E93',
};

const SKILL_OPTIONS: SkillLevel[] = ['amateur', 'medium', 'pro'];
const SKILL_LABELS: Record<SkillLevel, string> = { amateur: 'Люб', medium: 'Сред', pro: 'Про' };
const SKILL_COLORS: Record<SkillLevel, string> = {
  amateur: '#34C759',
  medium: '#FF9500',
  pro: '#FF3B30',
};

// ─── Player row ───────────────────────────────────────────────────────────────

function PlayerRow({
  p,
  onRoleChange,
  onSkillChange,
}: {
  p: Profile;
  onRoleChange: (id: string, role: UserRole) => void;
  onSkillChange: (id: string, skill: SkillLevel) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.playerRow, { borderBottomColor: colors.separator }]}>
      <Avatar name={p.name} uri={p.avatar_url} size="sm" />
      <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>
        {p.name}
      </Text>
      <View style={styles.chips}>
        {/* Role chip */}
        <TouchableOpacity
          onPress={() => {
            const idx = ROLE_OPTIONS.indexOf(p.role);
            const next = ROLE_OPTIONS[(idx + 1) % ROLE_OPTIONS.length];
            Alert.alert(
              'Изменить роль',
              `${p.name} → ${ROLE_LABELS[next]}?`,
              [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Изменить', onPress: () => onRoleChange(p.id, next) },
              ],
            );
          }}
          style={[
            styles.chip,
            { backgroundColor: ROLE_COLORS[p.role] + '22', borderColor: ROLE_COLORS[p.role] + '44' },
          ]}
        >
          <Text style={[styles.chipText, { color: ROLE_COLORS[p.role] }]}>
            {ROLE_LABELS[p.role]}
          </Text>
        </TouchableOpacity>

        {/* Skill chip */}
        <TouchableOpacity
          onPress={() => {
            const idx = SKILL_OPTIONS.indexOf(p.skill_level);
            const next = SKILL_OPTIONS[(idx + 1) % SKILL_OPTIONS.length];
            onSkillChange(p.id, next);
          }}
          style={[
            styles.chip,
            {
              backgroundColor: SKILL_COLORS[p.skill_level] + '22',
              borderColor: SKILL_COLORS[p.skill_level] + '44',
            },
          ]}
        >
          <Text style={[styles.chipText, { color: SKILL_COLORS[p.skill_level] }]}>
            {SKILL_LABELS[p.skill_level]}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Invite code row ──────────────────────────────────────────────────────────

function InviteRow({
  code,
  onDeactivate,
}: {
  code: InviteCode;
  onDeactivate: (id: string) => void;
}) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View style={[styles.codeRow, { borderBottomColor: colors.separator }]}>
      <Text style={[styles.codeText, { color: colors.text }]}>{code.code}</Text>
      <View style={styles.codeActions}>
        <TouchableOpacity onPress={handleCopy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Copy size={18} color={copied ? colors.success : colors.accent} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Деактивировать код?', code.code, [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Удалить', style: 'destructive', onPress: () => onDeactivate(code.id) },
            ])
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={18} color={colors.danger} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subMembers, setSubMembers] = useState<SubscriptionMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showCreateSub, setShowCreateSub] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profiles, codes, activeSub] = await Promise.all([
        fetchAllProfiles(),
        fetchActiveInviteCodes(),
        fetchActiveSubscription(),
      ]);
      setPlayers(profiles);
      setInviteCodes(codes);
      if (activeSub) {
        const { members } = await fetchSubscriptionDetail(activeSub.id);
        setSubscription(activeSub);
        setSubMembers(members);
      } else {
        setSubscription(null);
        setSubMembers([]);
      }
    } catch (e) {
      console.error('Admin load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  async function handleRoleChange(id: string, role: UserRole) {
    await updateProfileRole(id, role);
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
  }

  async function handleSkillChange(id: string, skill: SkillLevel) {
    await updateProfileSkill(id, skill);
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, skill_level: skill } : p)));
  }

  async function handleGenerate() {
    if (!profile || generating) return;
    setGenerating(true);
    try {
      const code = await generateInviteCode(profile.id);
      setInviteCodes((prev) => [code, ...prev]);
      setSegmentIndex(1);
    } catch (e) {
      console.error('Generate code error:', e);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeactivate(id: string) {
    await deactivateInviteCode(id);
    setInviteCodes((prev) => prev.filter((c) => c.id !== id));
  }

  function handleCloseSub() {
    if (!subscription) return;
    Alert.alert(
      'Закрыть абонемент?',
      'Запись будет прекращена. Отменить нельзя.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Закрыть',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeSubscription(subscription.id);
              setSubscription((prev) => prev ? { ...prev, status: 'closed' } : prev);
            } catch (e: any) {
              Alert.alert('Ошибка', e.message);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={Platform.OS === 'web' ? [] : ['top']}
    >
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.accent} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Админ-панель</Text>
        {segmentIndex === 1 && (
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={generating}
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
        {segmentIndex === 2 && !subscription && (
          <TouchableOpacity
            onPress={() => setShowCreateSub(true)}
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
        {(segmentIndex === 0 || (segmentIndex === 2 && !!subscription)) && (
          <View style={{ width: 34 }} />
        )}
      </View>

      <SegmentedControl
        options={['Игроки', 'Инвайты', 'Абонемент']}
        selectedIndex={segmentIndex}
        onChange={setSegmentIndex}
        style={styles.segmented}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {loading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
            <CardSkeleton />
          </>
        ) : segmentIndex === 0 ? (
          <View style={[styles.listCard, { backgroundColor: colors.backgroundTertiary }]}>
            {players.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>Нет игроков</Text>
            ) : (
              players.map((p) => (
                <PlayerRow
                  key={p.id}
                  p={p}
                  onRoleChange={handleRoleChange}
                  onSkillChange={handleSkillChange}
                />
              ))
            )}
          </View>
        ) : segmentIndex === 1 ? (
          <>
            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              Нажмите + чтобы создать новый инвайт-код. Передайте код игроку при регистрации.
            </Text>
            <View style={[styles.listCard, { backgroundColor: colors.backgroundTertiary }]}>
              {inviteCodes.length === 0 ? (
                <Text style={[styles.empty, { color: colors.textSecondary }]}>
                  Нет активных кодов
                </Text>
              ) : (
                inviteCodes.map((c) => (
                  <InviteRow key={c.id} code={c} onDeactivate={handleDeactivate} />
                ))
              )}
            </View>
          </>
        ) : (
          <>
            {!subscription ? (
              <>
                <Text style={[styles.hint, { color: colors.textTertiary }]}>
                  Нет активного абонемента. Нажмите + чтобы создать.
                </Text>
                <Button
                  label="Создать абонемент"
                  onPress={() => setShowCreateSub(true)}
                  style={styles.createSubBtn}
                />
              </>
            ) : (
              <>
                {/* Subscription info card */}
                <View style={[styles.subCard, { backgroundColor: colors.backgroundTertiary }]}>
                  <View style={styles.subRow}>
                    <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Месяц</Text>
                    <Text style={[styles.subValue, { color: colors.text }]}>
                      {new Date(subscription.month + 'T12:00:00').toLocaleDateString('ru-RU', {
                        month: 'long', year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={[styles.subDivider, { backgroundColor: colors.separator }]} />
                  <View style={styles.subRow}>
                    <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Статус</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: subscription.status === 'open' ? '#30D15820' : '#8E8E9320' },
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        { color: subscription.status === 'open' ? '#30D158' : '#8E8E93' },
                      ]}>
                        {subscription.status === 'open' ? 'Открыт' : 'Закрыт'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.subDivider, { backgroundColor: colors.separator }]} />
                  <View style={styles.subRow}>
                    <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Участников</Text>
                    <Text style={[styles.subValue, { color: colors.text }]}>{subMembers.length} чел.</Text>
                  </View>
                  <View style={[styles.subDivider, { backgroundColor: colors.separator }]} />
                  <View style={styles.subRow}>
                    <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Аренда</Text>
                    <Text style={[styles.subValue, { color: colors.text }]}>
                      {subscription.rent_cost.toLocaleString('ru-RU')} ₽
                    </Text>
                  </View>
                  {subscription.bank_compensation > 0 && (
                    <>
                      <View style={[styles.subDivider, { backgroundColor: colors.separator }]} />
                      <View style={styles.subRow}>
                        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Компенсация</Text>
                        <Text style={[styles.subValue, { color: '#30D158' }]}>
                          {subscription.bank_compensation.toLocaleString('ru-RU')} ₽
                        </Text>
                      </View>
                    </>
                  )}
                  {subMembers.length > 0 && (
                    <>
                      <View style={[styles.subDivider, { backgroundColor: colors.separator }]} />
                      <View style={styles.subRow}>
                        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>≈ С человека</Text>
                        <Text style={[styles.subValue, { color: colors.text }]}>
                          {Math.round(
                            (subscription.rent_cost - subscription.bank_compensation) / subMembers.length
                          ).toLocaleString('ru-RU')} ₽
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Open in subscription screen */}
                <TouchableOpacity
                  style={[styles.linkRow, { borderColor: colors.separator }]}
                  onPress={() => router.push(`/subscription/${subscription.id}` as any)}
                >
                  <ExternalLink size={16} color={colors.accent} strokeWidth={2} />
                  <Text style={[styles.linkText, { color: colors.accent }]}>Открыть экран абонемента</Text>
                </TouchableOpacity>

                {/* Close subscription */}
                {subscription.status === 'open' && (
                  <Button
                    label="Закрыть абонемент"
                    variant="destructive"
                    onPress={handleCloseSub}
                    style={styles.closeSubBtn}
                  />
                )}

                {/* New subscription after closed */}
                {subscription.status === 'closed' && (
                  <Button
                    label="Создать новый абонемент"
                    onPress={() => setShowCreateSub(true)}
                    style={styles.createSubBtn}
                  />
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <CreateSubscriptionSheet
        visible={showCreateSub}
        onClose={() => setShowCreateSub(false)}
        onCreated={(sub) => {
          setSubscription(sub);
          setSubMembers([]);
        }}
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
    gap: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  scroll: {
    padding: 16,
    paddingBottom: 100,
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  playerName: {
    flex: 1,
    fontSize: 15,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  codeText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  codeActions: {
    flexDirection: 'row',
    gap: 16,
  },
  empty: {
    textAlign: 'center',
    padding: 20,
    fontSize: 15,
  },
  hint: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  subCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  subLabel: {
    fontSize: 15,
  },
  subValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  subDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
  createSubBtn: {
    marginTop: 4,
  },
  closeSubBtn: {},
});
