import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface FloatCTAProps {
  label: string;
  onPress: () => void;
  color?: string;
  shadowColor?: string;
  icon?: string;
}

export default function FloatCTA({
  label,
  onPress,
  color = COLORS.coral,
  shadowColor = COLORS.coralDeep,
  icon,
}: FloatCTAProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, {
        backgroundColor: color,
        shadowColor: shadowColor,
      }]}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 88,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 10,
  },
  icon: {
    fontSize: 16,
    color: '#fff',
  },
  label: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: '#fff',
  },
});
