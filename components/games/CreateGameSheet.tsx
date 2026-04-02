import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth';
import { createGame, updateGame } from '@/lib/gamesApi';
import { Game } from '@/lib/types';

interface CreateGameSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  editGame?: Game | null;
}

function getNextFriday(): string {
  const d = new Date();
  const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return d.toISOString().split('T')[0];
}

export function CreateGameSheet({ visible, onClose, onSaved, editGame }: CreateGameSheetProps) {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [priceRub, setPriceRub] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (editGame) {
      setDate(editGame.date);
      setTime(editGame.time.slice(0, 5));
      setLocation(editGame.location);
      setDescription(editGame.description ?? '');
      setPriceRub(editGame.price_rub != null ? String(editGame.price_rub) : '');
    } else {
      setDate(getNextFriday());
      setTime('20:00');
      setLocation('');
      setDescription('');
      setPriceRub('');
    }
    setError('');
  }, [visible, editGame]);

  async function handleSave() {
    setError('');
    if (!date.trim() || !time.trim() || !location.trim()) {
      setError('Заполните дату, время и место');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      setError('Формат даты: ГГГГ-ММ-ДД (напр. 2026-04-10)');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time.trim())) {
      setError('Формат времени: ЧЧ:ММ (напр. 20:00)');
      return;
    }

    setLoading(true);
    try {
      const parsedPrice = priceRub.trim() ? parseInt(priceRub.trim(), 10) : undefined;

      if (editGame) {
        await updateGame(editGame.id, {
          date: date.trim(),
          time: time.trim() + ':00',
          location: location.trim(),
          description: description.trim() || undefined,
          price_rub: parsedPrice ?? null,
        });
      } else {
        await createGame({
          date: date.trim(),
          time: time.trim() + ':00',
          location: location.trim(),
          description: description.trim(),
          createdBy: profile!.id,
          price_rub: parsedPrice ?? null,
        });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} snapHeight={540}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {editGame ? 'Редактировать игру' : 'Новая игра'}
        </Text>

        <Input
          label="Дата (ГГГГ-ММ-ДД)"
          placeholder="2026-04-10"
          value={date}
          onChangeText={setDate}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />
        <Input
          label="Время (ЧЧ:ММ)"
          placeholder="20:00"
          value={time}
          onChangeText={setTime}
          keyboardType="numbers-and-punctuation"
        />
        <Input
          label="Место"
          placeholder="Стадион Динамо, поле №2"
          value={location}
          onChangeText={setLocation}
        />
        <Input
          label="Стоимость участия (₽, необязательно)"
          placeholder="1200"
          value={priceRub}
          onChangeText={setPriceRub}
          keyboardType="number-pad"
        />
        <Input
          label="Описание (необязательно)"
          placeholder="Дополнительная информация..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, paddingTop: 12 }}
        />

        {!!error && (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        )}

        <Button
          label={editGame ? 'Сохранить' : 'Создать игру'}
          onPress={handleSave}
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
