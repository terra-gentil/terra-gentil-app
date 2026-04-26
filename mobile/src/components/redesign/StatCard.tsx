import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  bgColor: string;
}

export default function StatCard({ icon, label, value, bgColor }: StatCardProps) {
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
  },
  value: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.md,
    color: COLORS.ink,
    marginTop: 6,
  },
});
