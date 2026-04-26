import { StyleSheet, ViewStyle } from 'react-native';

export const COLORS = {
  // Verdes (primario)
  green: '#16a34a',
  greenDeep: '#15803d',
  greenDark: '#14532d',
  greenSoft: '#dcfce7',
  greenLeaf: '#22c55e',

  // Coral/Rosa (CTA + acoes sociais)
  coral: '#fb6f92',
  coralDeep: '#e63b6e',
  coralSoft: '#ffe1ec',

  // Apoio
  amber: '#f59e0b',
  amberSoft: '#fef3c7',
  sky: '#38bdf8',
  skySoft: '#e0f2fe',
  lavender: '#a78bfa',
  lavenderSoft: '#ede9fe',

  // Neutros
  bg: '#f6f1e7',
  card: '#ffffff',
  ink: '#1c1917',
  inkSoft: '#57534e',
  inkMute: '#a8a29e',
  divider: '#efeae0',
};

export const FONTS = {
  display: 'Nunito_700Bold',
  displayBold: 'Nunito_800ExtraBold',
  displayBlack: 'Nunito_900Black',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  bodyExtraBold: 'PlusJakartaSans_800ExtraBold',
};

export const SIZES = {
  xs: 11,
  sm: 12,
  smPlus: 13,
  body: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  hero: 28,
  giant: 32,
};

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 24,
  hero: 28,
  pill: 100,
};

export const SPACING = {
  screenPadding: 16,
  cardGap: 10,
  sectionGap: 14,
};

export function shadowChunky(color: string = COLORS.greenDeep): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  };
}

export function shadowSoft(): ViewStyle {
  return {
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  };
}

export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    ...shadowSoft(),
  },
});
