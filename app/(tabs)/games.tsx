import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';
import { GameCard } from '@/components/games/GameCard';
import { CreateGameSheet } from '@/components/games/CreateGameSheet';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { fetchUpcomingGames, fetchPastGames, fetchRegistrations } from '@/lib/gamesApi';
import { Game, GameRegistration } from '@/lib/types';

export default function GamesScreen() {
  const { colors } = useTheme();
  const { profile, isAdmin } = useAuth();
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [games, setGames] = useState<Game[]>([]);
  const [regsMap, setRegsMap] = useState<Record<string, GameRegistration[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = segmentIndex === 0
        ? await fetchUpcomingGames()
        : await fetchPastGames();
      setGames(data);

      const map: Record<string, GameRegistration[]> = {};
      await Promise.all(
        data.map(async (g) => {
          const regs = await fetchRegistrations(g.id);
          map[g.id] = regs;
        })
      );
      setRegsMap(map);
    } catch (e) {
      console.error('Failed to load games:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [segmentIndex]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return (
    <ScreenBackground overlayOpacity={0.60}>
      <SafeAreaView style={styles.safe} edges={Platform.OS === 'web' ? [] : ['top']}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Text style={styles.largeTitle}>Игры</Text>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => setShowCreate(true)}
              style={styles.addButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Plus size={20} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* Segment */}
        <SegmentedControl
          options={['Предстоящие', 'Прошедшие']}
          selectedIndex={segmentIndex}
          onChange={setSegmentIndex}
          style={styles.segmented}
        />

        {/* List */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#C1121F"
            />
          }
        >
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : games.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {segmentIndex === 0 ? 'Нет предстоящих игр' : 'Нет прошедших игр'}
              </Text>
              {isAdmin && segmentIndex === 0 && (
                <Text style={styles.emptyHint}>Нажмите + чтобы создать игру</Text>
              )}
            </View>
          ) : (
            games.map((game, index) => {
              const regs = regsMap[game.id] ?? [];
              const isRegistered = regs.some((r) => r.player_id === profile?.id);
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  registrationCount={regs.length}
                  isRegistered={isRegistered}
                  index={index}
                />
              );
            })
          )}
        </ScrollView>

        <CreateGameSheet
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          onSaved={load}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  largeTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.37,
    flex: 1,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#C1121F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C1121F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.40,
    shadowRadius: 8,
    elevation: 4,
  },
  segmented: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  scroll: {
    padding: 16,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
  },
});
