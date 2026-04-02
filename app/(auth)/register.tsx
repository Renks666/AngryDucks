import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/hooks/useTheme';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const inviteRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!firstName.trim()) { setError('Введите имя'); return; }
    if (!lastName.trim()) { setError('Введите фамилию'); return; }
    if (!email.trim()) { setError('Введите email'); return; }
    if (password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }

    setLoading(true);
    setError('');
    try {
      await signUp({
        email: email.trim().toLowerCase(),
        password,
        name: `${firstName.trim()} ${lastName.trim()}`,
        inviteCode: inviteCode.trim() || undefined,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={[styles.successTitle, { color: colors.text }]}>
          Аккаунт создан!
        </Text>
        <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
          {inviteCode.trim()
            ? 'Ты теперь часть команды! Войди в аккаунт.'
            : 'Твой запрос отправлен. Администратор подтвердит твой аккаунт.'}
        </Text>
        <Button
          label="Войти"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.btn}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Dark header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>DUCK TEAM</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>← Назад</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>Регистрация</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Создай аккаунт в Duck Team
        </Text>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        <Input
          label="Имя"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Иван"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => lastNameRef.current?.focus()}
        />
        <Input
          ref={lastNameRef}
          label="Фамилия"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Иванов"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <Input
          ref={emailRef}
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <Input
          ref={passwordRef}
          label="Пароль"
          value={password}
          onChangeText={setPassword}
          placeholder="Минимум 6 символов"
          secureTextEntry
          returnKeyType="next"
          onSubmitEditing={() => inviteRef.current?.focus()}
        />
        <Input
          ref={inviteRef}
          label="Инвайт-код (необязательно)"
          value={inviteCode}
          onChangeText={(t) => setInviteCode(t.toUpperCase())}
          placeholder="DUCK-XXXX"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />

        <View style={[styles.noteBox, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            💡 Без инвайт-кода ты получишь гостевой доступ до подтверждения администратором.
          </Text>
        </View>

        <Button
          label="Зарегистрироваться"
          onPress={handleRegister}
          loading={loading}
          style={styles.btn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 10,
  },
  brandTitle: {
    color: '#F5E6D3',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 5,
  },
  form: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 24,
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  errorBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noteBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    marginTop: 4,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  btn: {
    marginTop: 4,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
});
