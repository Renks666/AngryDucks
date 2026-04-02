import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { createSubscription } from '@/lib/subscriptionsApi';
import { Subscription } from '@/lib/types';

interface CreateSubscriptionSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (sub: Subscription) => void;
}

function getCurrentMonthDefault(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function CreateSubscriptionSheet({ visible, onClose, onCreated }: CreateSubscriptionSheetProps) {
  const { colors } = useTheme();
  const [month, setMonth] = useState('');
  const [rentCost, setRentCost] = useState('');
  const [bankComp, setBankComp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setMonth(getCurrentMonthDefault());
    setRentCost('');
    setBankComp('');
    setError('');
  }, [visible]);

  async function handleCreate() {
    setError('');
    if (!/^\d{4}-\d{2}-01$/.test(month.trim())) {
      setError('Формат месяца: ГГГГ-ММ-01 (напр. 2026-04-01)');
      return;
    }
    const rent = parseInt(rentCost.trim(), 10);
    if (!rentCost.trim() || isNaN(rent) || rent <= 0) {
      setError('Укажите стоимость аренды');
      return;
    }
    const comp = bankComp.trim() ? parseInt(bankComp.trim(), 10) : 0;

    setLoading(true);
    try {
      const sub = await createSubscription({
        month: month.trim(),
        rent_cost: rent,
        bank_compensation: isNaN(comp) ? 0 : comp,
      });
      onCreated(sub);
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Ошибка создания');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} snapHeight={420}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Новый абонемент</Text>

        <Input
          label="Месяц (ГГГГ-ММ-01)"
          placeholder="2026-04-01"
          value={month}
          onChangeText={setMonth}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />
        <Input
          label="Аренда (₽)"
          placeholder="50000"
          value={rentCost}
          onChangeText={setRentCost}
          keyboardType="number-pad"
        />
        <Input
          label="Компенсация из банка (₽, необязательно)"
          placeholder="5000"
          value={bankComp}
          onChangeText={setBankComp}
          keyboardType="number-pad"
        />

        {!!error && (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        )}

        <Button
          label="Создать абонемент"
          onPress={handleCreate}
          loading={loading}
          style={styles.button}
        />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
});
