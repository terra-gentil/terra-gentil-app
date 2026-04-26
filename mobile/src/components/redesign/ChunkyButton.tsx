import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface ChunkyButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  shadowColor?: string;
  textColor?: string;
  outline?: boolean;
  icon?: string;
  style?: ViewStyle;
  fontSize?: number;
}

export default function ChunkyButton({
  label,
  onPress,
  color = COLORS.green,
  shadowColor = COLORS.greenDeep,
  textColor = '#fff',
  outline = false,
  icon,
  style,
  fontSize = 15,
}: ChunkyButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.base,
        outline
          ? { backgroundColor: '#fff', borderWidth: 2, borderColor: color }
          : {
              backgroundColor: color,
              shadowColor: shadowColor,
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 5,
            },
        style,
      ]}
    >
      {icon && <Text style={{ fontSize: fontSize + 2, marginRight: 8 }}>{icon}</Text>}
      <Text
        style={[
          styles.label,
          { color: outline ? COLORS.greenDark : textColor, fontSize },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  label: {
    fontFamily: FONTS.bodyExtraBold,
  },
});
