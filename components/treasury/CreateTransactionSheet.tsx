import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth';
import { createTransaction, fetchAllPlayers } from '@/lib/transactionsApi';
import { Profile, TransactionType } from '@/lib/types';

interface CreateTransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const TYPES: { value: TransactionType; label: string; isExpense: boolean }[] = [
  { value: 'subscription',  label: 'Взнос',          isExpense: false },
  { value: 'guest_payment', label: 'Гость',           isExpense: false },
  { value: 'expense',       label: 'Расход',          isExpense: true  },
  { value: 'adjustment',    label: 'Корректировка',   isExpense: false },
];

export function CreateTransactionSheet({ visible, onClose, onCreated }: CreateTransactionSheetProps) {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [type, setType] = useState<TransactionType>('subscription');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Profile | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setType('subscription');
      setAmount('');
      setDescription('');
      setSelectedPlayer(null);
      setShowPlayerList(false);
      setError('');
      fetchAllPlayers().then(setPlayers).catch(() => {});
    }
  }, [visible]);

  const showPlayerPicker = type !== 'expense';

  async function handleCreate() {
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Введите корректную сумму');
      return;
    }
    if (!description.trim()) {
      setError('Введите описание');
      return;
    }
    if (!profile) return;

    const signedAmount = type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

    setLoading(true);
    setError('');
    try {
      await createTransaction({
        player_id: selectedPlayer?.id ?? null,
        type,
        amount: signedAmount,
        description: description.trim(),
        game_id: null,
        created_by: profile.id,
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} snapHeight={580}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Новая транзакция</Text>

        {/* Type chips */}
        <View style={styles.typeRow}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => { setType(t.value); setError(''); }}
              style={[
                styles.typeChip,
                {
                  backgroundColor: type === t.value ? colors.accent : colors.backgroundTertiary,
                  borderColor: type === t.value ? colors.accent : colors.separator,
                },
              ]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  { color: type === t.value ? '#fff' : colors.textSecondary },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <Input
          label={type === 'expense' ? 'Сумма расхода (₽)' : 'Сумма (₽)'}
          placeholder="0"
          value={amount}
          onChangeText={(v) => { setAmount(v); setError(''); }}
          keyboardType="decimal-pad"
        />

        {/* Description */}
        <Input
          label="Описание"
          placeholder="Аренда поля, взнос за Январь…"
          value={description}
          onChangeText={(v) => { setDescription(v); setError(''); }}
          returnKeyType="done"
        />

        {/* Player picker (not shown for expense) */}
        {showPlayerPicker && (
          <View style={styles.playerSection}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Игрок{' '}
              <Text style={styles.optional}>(необязательно)</Text>
            </Text>

            {selectedPlayer ? (
              <TouchableOpacity
                style={[styles.selectedPlayer, { backgroundColor: colors.backgroundTertiary, borderColor: colors.separator }]}
                onPress={() => setSelectedPlayer(null)}
              >
                <Avatar name={selectedPlayer.name} uri={selectedPlayer.avatar_url} size="xs" />
                <Text style={[styles.selectedPlayerName, { color: colors.text }]}>
                  {selectedPlayer.name}
                </Text>
                <Text style={[styles.clearIcon, { color: colors.textTertiary }]}>✕</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: colors.backgroundTertiary, borderColor: colors.separator }]}
                onPress={() => setShowPlayerList((v) => !v)}
              >
                <Text style={[styles.pickerBtnText, { color: colors.textSecondary }]}>
                  {showPlayerList ? 'Скрыть список' : 'Выбрать игрока'}
                </Text>
              </TouchableOpacity>
            )}

            {showPlayerList && !selectedPlayer && (
              <View style={[styles.playerList, { backgroundColor: colors.backgroundTertiary, borderColor: colors.separator }]}>
                {players.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playerRow, { borderBottomColor: colors.separator }]}
                    onPress={() => { setSelectedPlayer(p); setShowPlayerList(false); }}
                  >
                    <Avatar name={p.name} uri={p.avatar_url} size="xs" />
                    <Text style={[styles.playerRowName, { color: colors.text }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {!!error && (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        )}

        <Button label="Создать" onPress={handleCreate} loading={loading} style={styles.btn} />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  optional: {
    fontSize: 12,
    fontWeight: '400',
  },
  playerSection: {
    marginTop: 4,
    marginBottom: 12,
  },
  pickerBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerBtnText: {
    fontSize: 15,
  },
  selectedPlayer: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  selectedPlayerName: {
    flex: 1,
    fontSize: 15,
  },
  clearIcon: {
    fontSize: 14,
  },
  playerList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: 200,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  playerRowName: {
    fontSize: 15,
  },
  error: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  btn: {
    marginTop: 12,
  },
});
