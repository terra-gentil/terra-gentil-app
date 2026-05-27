import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES, shadowSoft } from '../../constants/theme';

interface ProximoSelo {
  emoji: string;
  nome: string;
  desc: string;
}

interface StreakStripProps {
  diasUnicos: number;
  proximoSelo?: ProximoSelo | null;
  selosDesbloqueados?: number;
  totalSelos?: number;
  onPress?: () => void;
}

export default function StreakStrip({ diasUnicos, proximoSelo, selosDesbloqueados = 0, totalSelos = 13, onPress }: StreakStripProps) {
  const diasLabel = diasUnicos === 1 ? "1 dia de cuidado" : `${diasUnicos} dias de cuidado`;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <View style={styles.flameWrap}>
        <Text style={styles.flame}>{diasUnicos >= 7 ? "🔥" : "🌱"}</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{diasLabel}</Text>
        {proximoSelo ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            Proximo: <Text style={styles.badgeName}>{proximoSelo.emoji} {proximoSelo.nome}</Text>
            <Text style={styles.badgeDesc}>  {proximoSelo.desc}</Text>
          </Text>
        ) : (
          <Text style={styles.subtitle}>
            {selosDesbloqueados}/{totalSelos} selos  <Text style={styles.badgeName}>🏆 Colecao completa!</Text>
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
  badgeDesc: {
    fontFamily: FONTS.body,
    color: COLORS.inkMute,
  },
  arrow: {
    fontSize: 22,
    color: COLORS.inkMute,
  },
});
