import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { updateMyProfile } from '@/lib/profileApi';
import { Profile, SkillLevel } from '@/lib/types';

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (updated: Profile) => void;
  profile: Profile;
}

const SKILL_OPTIONS: { value: SkillLevel; label: string; color: string }[] = [
  { value: 'amateur', label: 'Любитель', color: '#34C759' },
  { value: 'medium',  label: 'Средний',  color: '#FF9500' },
  { value: 'pro',     label: 'Про',      color: '#FF3B30' },
];

export function EditProfileSheet({ visible, onClose, onSaved, profile }: EditProfileSheetProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skill, setSkill] = useState<SkillLevel>('amateur');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName(profile.name);
      setPhone(profile.phone ?? '');
      setSkill(profile.skill_level);
      setError('');
    }
  }, [visible, profile]);

  async function handleSave() {
    if (!name.trim()) {
      setError('Введите имя');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const updated = await updateMyProfile(profile.id, {
        name: name.trim(),
        phone: phone.trim() || null,
        skill_level: skill,
      });
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} snapHeight={440}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Редактировать профиль</Text>

        <Input
          label="Имя"
          placeholder="Имя Фамилия"
          value={name}
          onChangeText={(v) => { setName(v); setError(''); }}
          autoFocus
        />

        <Input
          label="Телефон"
          placeholder="+7 900 000 00 00"
          value={phone}
          onChangeText={(v) => { setPhone(v); setError(''); }}
          keyboardType="phone-pad"
          returnKeyType="done"
        />

        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Уровень</Text>
        <View style={styles.skillRow}>
          {SKILL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setSkill(opt.value)}
              style={[
                styles.skillChip,
                {
                  backgroundColor:
                    skill === opt.value ? opt.color + '22' : colors.backgroundTertiary,
                  borderColor: skill === opt.value ? opt.color : colors.separator,
                },
              ]}
            >
              <Text
                style={[
                  styles.skillChipText,
                  { color: skill === opt.value ? opt.color : colors.textSecondary },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!error && (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        )}

        <Button label="Сохранить" onPress={handleSave} loading={loading} style={styles.btn} />
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 8,
  },
  skillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  skillChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  skillChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  btn: {
    marginTop: 4,
  },
});
