import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface SectionTitleProps {
  title: string;
  action?: string;
  actionColor?: string;
  onAction?: () => void;
}

export default function SectionTitle({
  title,
  action,
  actionColor = COLORS.coralDeep,
  onAction,
}: SectionTitleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[styles.action, { color: actionColor }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    fontFamily: FONTS.displayBlack,
    fontSize: 19,
    color: COLORS.greenDark,
  },
  action: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.smPlus,
  },
});
