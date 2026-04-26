import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES, shadowSoft } from '../../constants/theme';

interface StreakStripProps {
  days: number;
  badge?: string;
  onPress?: () => void;
}

export default function StreakStrip({ days, badge, onPress }: StreakStripProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <View style={styles.flameWrap}>
        <Text style={styles.flame}>🔥</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{days} dias cuidando 🔥</Text>
        {badge && (
          <Text style={styles.subtitle}>
            +1 selo desbloqueado: <Text style={styles.badgeName}>{badge}</Text>
          </Text>
        )}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 14,
    ...shadowSoft(),
  },
  flameWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.coralSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flame: {
    fontSize: 24,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: COLORS.ink,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  badgeName: {
    fontFamily: FONTS.bodyExtraBold,
    color: COLORS.coralDeep,
  },
  arrow: {
    fontSize: 22,
    color: COLORS.inkMute,
  },
});
