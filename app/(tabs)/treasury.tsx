import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { CardSkeleton, RowSkeleton } from '@/components/ui/SkeletonLoader';
import { CreateTransactionSheet } from '@/components/treasury/CreateTransactionSheet';
import {
  fetchMyTransactions,
  fetchAllTransactions,
  fetchMyBalance,
  fetchClubBalance,
  fetchPlayerBalances,
  deleteTransaction,
} from '@/lib/transactionsApi';
import { Transaction, PlayerBalance, TransactionType } from '@/lib/types';

const TYPE_LABELS: Record<TransactionType, string> = {
  subscription:  'Взнос',
  guest_payment: 'Гость',
  expense:       'Расход',
  adjustment:    'Корректировка',
};

function formatAmount(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('ru-RU');
  return amount >= 0 ? `+${abs} ₽` : `−${abs} ₽`;
}

function formatBalance(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('ru-RU');
  return amount >= 0 ? `${abs} ₽` : `−${abs} ₽`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(iso));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function BalanceCard({ balance, label }: { balance: number; label: string }) {
  const { colors } = useTheme();
  const isPositive = balance >= 0;
  return (
    <Card style={styles.balanceCard} elevated>
      <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.balanceAmount, { color: isPositive ? colors.success : colors.danger }]}>
        {formatBalance(balance)}
      </Text>
    </Card>
  );
}

function TransactionRow({
  tx,
  isAdmin,
  onDelete,
}: {
  tx: Transaction;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const { colors } = useTheme();
  const isIncome = tx.amount >= 0;

  return (
    <TouchableOpacity
      style={[styles.txRow, { borderBottomColor: colors.separator }]}
      onLongPress={
        isAdmin
          ? () => {
              Alert.alert('Удалить транзакцию', 'Это действие нельзя отменить.', [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Удалить', style: 'destructive', onPress: () => onDelete(tx.id) },
              ]);
            }
          : undefined
      }
      activeOpacity={isAdmin ? 0.7 : 1}
    >
      <View
        style={[
          styles.txIcon,
          {
            backgroundColor: isIncome
              ? 'rgba(52, 199, 89, 0.12)'
              : 'rgba(255, 59, 48, 0.12)',
          },
        ]}
      >
        {isIncome ? (
          <TrendingUp size={16} color={colors.success} strokeWidth={2} />
        ) : (
          <TrendingDown size={16} color={colors.danger} strokeWidth={2} />
        )}
      </View>
      <View style={styles.txMid}>
        <Text style={[styles.txDesc, { color: colors.text }]} numberOfLines={1}>
          {tx.description}
        </Text>
        <Text style={[styles.txMeta, { color: colors.textTertiary }]}>
          {TYPE_LABELS[tx.type]}
          {isAdmin && tx.profile ? ` · ${tx.profile.name}` : ''}
          {' · '}
          {formatDate(tx.created_at)}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: isIncome ? colors.success : colors.danger }]}>
        {formatAmount(tx.amount)}
      </Text>
    </TouchableOpacity>
  );
}

function PlayerBalanceRow({ pb }: { pb: PlayerBalance }) {
  const { colors } = useTheme();
  const isPositive = pb.balance >= 0;
  return (
    <View style={[styles.pbRow, { borderBottomColor: colors.separator }]}>
      <Avatar name={pb.profile.name} uri={pb.profile.avatar_url} size="sm" />
      <Text style={[styles.pbName, { color: colors.text }]}>{pb.profile.name}</Text>
      <Text style={[styles.pbBalance, { color: isPositive ? colors.success : colors.danger }]}>
        {formatBalance(pb.balance)}
      </Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function TreasuryScreen() {
  const { colors } = useTheme();
  const { profile, isAdmin } = useAuth();
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [playerBalances, setPlayerBalances] = useState<PlayerBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      if (isAdmin) {
        const [bal, txs, pbs] = await Promise.all([
          fetchClubBalance(),
          fetchAllTransactions(),
          fetchPlayerBalances(),
        ]);
        setBalance(bal);
        setTransactions(txs);
        setPlayerBalances(pbs);
      } else {
        const [bal, txs] = await Promise.all([
          fetchMyBalance(profile.id),
          fetchMyTransactions(profile.id),
        ]);
        setBalance(bal);
        setTransactions(txs);
      }
    } catch (e) {
      console.error('Failed to load treasury:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile, isAdmin]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  async function handleDelete(id: string) {
    try {
      await deleteTransaction(id);
      load();
    } catch (e) {
      console.error('Failed to delete transaction:', e);
    }
  }

  const showBalances = isAdmin && segmentIndex === 1;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={Platform.OS === 'web' ? [] : ['top']}
    >
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={[styles.largeTitle, { color: colors.text }]}>Казна</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Balance card */}
        {loading ? (
          <CardSkeleton style={styles.balanceCardSpacing} />
        ) : (
          <BalanceCard
            balance={balance}
            label={isAdmin ? 'Баланс клуба' : 'Мой баланс'}
          />
        )}

        {/* Admin: tab selector */}
        {isAdmin && (
          <SegmentedControl
            options={['Транзакции', 'Балансы']}
            selectedIndex={segmentIndex}
            onChange={setSegmentIndex}
            style={styles.segmented}
          />
        )}

        {/* Content */}
        {loading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : showBalances ? (
          <View style={[styles.listCard, { backgroundColor: colors.backgroundTertiary }]}>
            {playerBalances.length === 0 ? (
              <Text style={[styles.emptyInCard, { color: colors.textSecondary }]}>
                Нет игроков
              </Text>
            ) : (
              playerBalances.map((pb) => <PlayerBalanceRow key={pb.profile.id} pb={pb} />)
            )}
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Нет транзакций
            </Text>
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: colors.backgroundTertiary }]}>
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isAdmin={isAdmin}
                onDelete={handleDelete}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CreateTransactionSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
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
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 16,
    paddingBottom: 100,
  },
  balanceCardSpacing: {
    marginBottom: 16,
  },
  balanceCard: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  segmented: {
    marginBottom: 16,
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMid: {
    flex: 1,
  },
  txDesc: {
    fontSize: 15,
    fontWeight: '500',
  },
  txMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  pbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  pbName: {
    flex: 1,
    fontSize: 15,
  },
  pbBalance: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyInCard: {
    textAlign: 'center',
    padding: 20,
    fontSize: 15,
  },
});
