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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Mail, Lock } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { ScreenBackground } from '@/components/ui/ScreenBackground';

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Введите email и пароль');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(e.message ?? 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground overlayOpacity={0.65}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + brand */}
          <Animated.View
            entering={FadeInDown.delay(80).springify().damping(18)}
            style={styles.brandSection}
          >
            <View style={styles.logoWrap}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>DUCK TEAM</Text>
            <Text style={styles.brandSubtitle}>Управляй командой</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(160).springify().damping(20)}
            style={styles.formCard}
          >
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email input */}
            <View style={[styles.inputRow, emailFocused && styles.inputRowFocused]}>
              <Mail size={18} color="rgba(255,255,255,0.45)" strokeWidth={1.8} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="next"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            {/* Password input */}
            <View style={[styles.inputRow, passFocused && styles.inputRowFocused]}>
              <Lock size={18} color="rgba(255,255,255,0.45)" strokeWidth={1.8} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Пароль"
                placeholderTextColor="rgba(255,255,255,0.35)"
                secureTextEntry
                returnKeyType="done"
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
                onSubmitEditing={handleLogin}
              />
            </View>

            <Button
              label="Войти"
              onPress={handleLogin}
              loading={loading}
              style={styles.btn}
            />

            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Забыл пароль?</Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Нет аккаунта? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>Зарегистрироваться</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 44,
  },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(193,18,31,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(193,18,31,0.5)',
    shadowColor: '#C1121F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    width: 80,
    height: 80,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 8,
    marginBottom: 6,
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: 'rgba(11,11,13,0.72)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  errorBox: {
    backgroundColor: 'rgba(193,18,31,0.18)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(193,18,31,0.35)',
  },
  errorText: {
    color: '#FF6B7A',
    fontSize: 14,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 10,
  },
  inputRowFocused: {
    borderColor: 'rgba(193,18,31,0.7)',
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  btn: {
    marginTop: 8,
    marginBottom: 16,
  },
  forgotRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotText: {
    color: '#F4A300',
    fontSize: 14,
    fontWeight: '500',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
  },
  registerLink: {
    color: '#F4A300',
    fontSize: 15,
    fontWeight: '600',
  },
});
