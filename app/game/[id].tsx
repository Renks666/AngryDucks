import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Users,
  Shuffle,
  Edit2,
  Trash2,
  UserPlus,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { CreateGameSheet } from '@/components/games/CreateGameSheet';
import { AddGuestSheet } from '@/components/games/AddGuestSheet';
import {
  fetchGame,
  fetchRegistrations,
  fetchTeams,
  registerForGame,
  unregisterFromGame,
  removeRegistration,
  deleteGame,
  saveGeneratedTeams,
  updateGame,
  type TeamWithMembers,
} from '@/lib/gamesApi';
import { regenerateTeams, type PlayerInput } from '@/utils/teamGenerator';
import { Game, GameRegistration } from '@/lib/types';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { profile, isAdmin } = useAuth();

  const [game, setGame] = useState<Game | null>(null);
  const [registrations, setRegistrations] = useState<GameRegistration[]>([]);
  const [teamsData, setTeamsData] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [teamCount, setTeamCount] = useState<2 | 3>(2);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [g, regs, teams] = await Promise.all([
        fetchGame(id),
        fetchRegistrations(id),
        fetchTeams(id),
      ]);
      setGame(g);
      setRegistrations(regs);
      setTeamsData(teams);
    } catch (e) {
      console.error('Failed to load game:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isRegistered = registrations.some((r) => r.player_id === profile?.id);
  const canRegister = game?.status === 'open' && profile?.role !== 'guest';

  async function handleToggleRegistration() {
    if (!profile || !game) return;
    setActionLoading(true);
    try {
      if (isRegistered) {
        await unregisterFromGame(game.id, profile.id);
      } else {
        await registerForGame(game.id, profile.id);
      }
      await load();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message ?? 'Не удалось выполнить действие');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveReg(reg: GameRegistration) {
    setActionLoading(true);
    try {
      await removeRegistration(reg.id);
      await load();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message ?? 'Не удалось удалить');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGenerateTeams() {
    if (!game) return;
    setActionLoading(true);
    try {
      const players: PlayerInput[] = registrations.map((r) => ({
        id: r.player_id ?? r.id,
        name: r.profile?.name ?? r.guest_name ?? 'Гость',
        skillLevel: r.profile?.skill_level ?? 'amateur',
        isGuest: !r.player_id,
        guestName: r.guest_name ?? undefined,
      }));
      const generated = regenerateTeams(players, teamCount);
      await saveGeneratedTeams(game.id, generated);
      await load();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message ?? 'Не удалось сгенерировать команды');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFinishGame() {
    if (!game) return;
    setActionLoading(true);
    try {
      await updateGame(game.id, { status: 'completed' });
      await load();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setActionLoading(false);
    }
  }

  function handleDeleteGame() {
    if (!game) return;
    Alert.alert(
      'Удалить игру?',
      'Все регистрации и команды будут удалены. Отменить нельзя.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deleteGame(game.id);
              router.back();
            } catch (e: any) {
              Alert.alert('Ошибка', e.message);
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  // ─── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={HIT_SLOP}>
            <ArrowLeft size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={HIT_SLOP}>
            <ArrowLeft size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Игра не найдена</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Derived data ────────────────────────────────────────────────────────────

  const formattedDate = (() => {
    const s = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date(game.date + 'T12:00:00'));
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  const formattedTime = game.time.slice(0, 5);
  const hasTeams = teamsData.length > 0;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={Platform.OS === 'web' ? [] : ['top']}
    >
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={HIT_SLOP}>
          <ArrowLeft size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]} numberOfLines={1}>
          Игра
        </Text>
        {isAdmin ? (
          <TouchableOpacity onPress={() => setShowEdit(true)} hitSlop={HIT_SLOP}>
            <Edit2 size={20} color={colors.accent} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Game info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundTertiary }]}>
          <View style={styles.infoRow}>
            <Calendar size={18} color={colors.brand} strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text }]}>{formattedDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={18} color={colors.brand} strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text }]}>{formattedTime}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={18} color={colors.brand} strokeWidth={2} />
            <Text style={[styles.infoText, { color: colors.text }]}>{game.location}</Text>
          </View>
          {!!game.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {game.description}
            </Text>
          )}
        </View>

        {/* Register / unregister */}
        {canRegister && (
          <Button
            label={isRegistered ? 'Отписаться' : 'Записаться'}
            variant={isRegistered ? 'secondary' : 'primary'}
            onPress={handleToggleRegistration}
            loading={actionLoading}
            style={styles.registerBtn}
          />
        )}
        {isRegistered && !canRegister && (
          <View style={styles.registeredRow}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.registeredText, { color: colors.success }]}>Вы записаны</Text>
          </View>
        )}

        {/* Players section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Игроки ({registrations.length})
          </Text>
          {isAdmin && game.status === 'open' && (
            <TouchableOpacity onPress={() => setShowAddGuest(true)} hitSlop={HIT_SLOP}>
              <UserPlus size={20} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>

        {registrations.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Никто ещё не записался
          </Text>
        ) : (
          <View style={[styles.listCard, { backgroundColor: colors.backgroundTertiary }]}>
            {registrations.map((reg, index) => {
              const name = reg.profile?.name ?? reg.guest_name ?? 'Гость';
              const isGuest = !reg.player_id;
              const isLast = index === registrations.length - 1;
              const canRemove = isAdmin || reg.player_id === profile?.id;

              return (
                <View key={reg.id}>
                  <View style={styles.playerRow}>
                    <Avatar name={name} size="sm" />
                    <View style={styles.playerInfo}>
                      <Text style={[styles.playerName, { color: colors.text }]}>
                        {name}
                        {isGuest && (
                          <Text style={{ color: colors.textSecondary }}> (гость)</Text>
                        )}
                      </Text>
                      {reg.profile?.skill_level && (
                        <Text style={[styles.playerSkill, { color: colors.textSecondary }]}>
                          {SKILL_LABELS[reg.profile.skill_level]}
                        </Text>
                      )}
                    </View>
                    {canRemove && game.status === 'open' && (
                      <TouchableOpacity
                        onPress={() => handleRemoveReg(reg)}
                        hitSlop={HIT_SLOP}
                      >
                        <Trash2 size={16} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[styles.separator, { backgroundColor: colors.separator, marginLeft: 56 }]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Teams */}
        {hasTeams && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24, marginBottom: 12 }]}>
              Команды
            </Text>
            {teamsData.map(({ team, members }) => (
              <View
                key={team.id}
                style={[styles.teamCard, { backgroundColor: colors.backgroundTertiary }]}
              >
                <Text style={[styles.teamName, { color: colors.brand }]}>{team.team_name}</Text>
                {members.map((m) => {
                  const name = m.profile?.name ?? m.guest_name ?? 'Гость';
                  return (
                    <View key={m.id} style={styles.teamMemberRow}>
                      <Avatar name={name} size="xs" />
                      <Text style={[styles.teamMemberName, { color: colors.text }]}>
                        {name}
                        {!m.player_id && (
                          <Text style={{ color: colors.textSecondary }}> (г)</Text>
                        )}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <View style={styles.adminSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Управление</Text>
            <View style={styles.teamCountRow}>
              <Text style={[styles.teamCountLabel, { color: colors.textSecondary }]}>Команды:</Text>
              {([2, 3] as const).map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setTeamCount(n)}
                  style={[
                    styles.teamCountBtn,
                    {
                      backgroundColor: teamCount === n ? colors.accent : colors.backgroundTertiary,
                      borderColor: teamCount === n ? colors.accent : colors.separator,
                    },
                  ]}
                >
                  <Text style={[styles.teamCountBtnText, { color: teamCount === n ? '#fff' : colors.textSecondary }]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              label={hasTeams ? 'Пересчитать команды' : 'Разбить на команды'}
              variant="secondary"
              onPress={handleGenerateTeams}
              loading={actionLoading}
              style={styles.adminBtn}
            />
            {game.status !== 'completed' && (
              <Button
                label="Завершить игру"
                variant="secondary"
                onPress={handleFinishGame}
                loading={actionLoading}
                style={styles.adminBtn}
              />
            )}
            <Button
              label="Удалить игру"
              variant="destructive"
              onPress={handleDeleteGame}
              loading={actionLoading}
              style={styles.adminBtn}
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <CreateGameSheet
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        onSaved={load}
        editGame={game}
      />
      <AddGuestSheet
        visible={showAddGuest}
        onClose={() => setShowAddGuest(false)}
        onAdded={load}
        gameId={game.id}
      />
    </SafeAreaView>
  );
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

const SKILL_LABELS = {
  amateur: 'Любитель',
  medium: 'Средний',
  pro: 'Про',
} as const;

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 4,
  },
  registerBtn: {
    marginBottom: 24,
  },
  registeredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 24,
  },
  registeredText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
  },
  playerSkill: {
    fontSize: 12,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  teamCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  teamMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '500',
  },
  adminSection: {
    marginTop: 24,
    gap: 10,
  },
  adminBtn: {},
  teamCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamCountLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 4,
  },
  teamCountBtn: {
    width: 44,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCountBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
