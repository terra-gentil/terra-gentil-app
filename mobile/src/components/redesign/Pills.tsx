import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface PillsProps {
  items: string[];
  active: string;
  onChange: (item: string) => void;
  color?: string;
  colorDeep?: string;
}

export default function Pills({
  items,
  active,
  onChange,
  color = COLORS.coral,
  colorDeep = COLORS.coralDeep,
}: PillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {items.map((item) => {
        const isActive = active === item;
        return (
          <TouchableOpacity
            key={item}
            onPress={() => onChange(item)}
            style={[
              styles.pill,
              isActive
                ? { backgroundColor: color, shadowColor: colorDeep, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }
                : { backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.divider },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: isActive ? '#fff' : COLORS.inkSoft },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
  },
  pillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.body,
  },
});
