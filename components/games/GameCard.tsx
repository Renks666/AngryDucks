import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MapPin, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { Game } from '@/lib/types';

interface GameCardProps {
  game: Game;
  registrationCount: number;
  isRegistered: boolean;
  index?: number;
}

function formatGameDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return 'Сегодня';
  if (target.getTime() === tomorrow.getTime()) return 'Завтра';

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

export function GameCard({ game, registrationCount, isRegistered, index = 0 }: GameCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(18).stiffness(180)}
      style={styles.cardWrap}
    >
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => router.push(`/game/${game.id}` as any)}
        style={styles.card}
      >
        {/* Top row: price */}
        {game.price_rub != null && (
          <View style={[styles.topRow, { marginBottom: 10 }]}>
            <Text style={styles.price}>{game.price_rub.toLocaleString('ru-RU')} ₽</Text>
          </View>
        )}

        {/* Time */}
        <Text style={styles.time}>{formatTime(game.time)}</Text>

        {/* Date + location */}
        <View style={styles.locationRow}>
          <MapPin size={13} color="rgba(255,255,255,0.45)" strokeWidth={1.8} />
          <Text style={styles.locationText} numberOfLines={1}>
            {formatGameDate(game.date)} • {game.location}
          </Text>
        </View>

        {/* Players count */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>УЧАСТНИКИ</Text>
            <Text style={styles.progressCount}>{registrationCount} чел.</Text>
          </View>
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.ctaBtn, isRegistered && styles.ctaBtnRegistered]}
          onPress={() => router.push(`/game/${game.id}` as any)}
          activeOpacity={0.8}
        >
          {isRegistered ? (
            <View style={styles.ctaInner}>
              <CheckCircle size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.ctaBtnText}>Вы записаны</Text>
            </View>
          ) : (
            <Text style={styles.ctaBtnText}>Участвовать</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(21,23,26,0.90)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(193,18,31,0.18)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  price: {
    color: '#F4A300',
    fontSize: 16,
    fontWeight: '700',
  },
  time: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 16,
  },
  locationText: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 13,
    flex: 1,
  },
  progressSection: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressCount: {
    color: '#30D158',
    fontSize: 13,
    fontWeight: '700',
  },
  ctaBtn: {
    backgroundColor: '#C1121F',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: '#C1121F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaBtnRegistered: {
    backgroundColor: 'rgba(193,18,31,0.40)',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
