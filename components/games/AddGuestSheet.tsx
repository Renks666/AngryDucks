import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { addGuestToGame } from '@/lib/gamesApi';

interface AddGuestSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
  gameId: string;
}

export function AddGuestSheet({ visible, onClose, onAdded, gameId }: AddGuestSheetProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setError('');
    }
  }, [visible]);

  async function handleAdd() {
    if (!name.trim()) {
      setError('Введите имя гостя');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addGuestToGame(gameId, name.trim());
      onAdded();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} snapHeight={280}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Добавить гостя</Text>
        <Input
          label="Имя"
          placeholder="Имя Фамилия"
          value={name}
          onChangeText={setName}
          autoFocus
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        {!!error && (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        )}
        <Button label="Добавить" onPress={handleAdd} loading={loading} style={styles.button} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
});
