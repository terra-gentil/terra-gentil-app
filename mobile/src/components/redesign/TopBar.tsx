import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageSourcePropType } from 'react-native';
import { COLORS, FONTS, SIZES, shadowSoft } from '../../constants/theme';

interface TopBarProps {
  avatarSource?: ImageSourcePropType;
  badge?: number;
  showSearch?: boolean;
  title?: string;
  onBellPress?: () => void;
  onAvatarPress?: () => void;
  onSearchPress?: () => void;
}

export default function TopBar({
  avatarSource,
  badge = 0,
  showSearch = true,
  title,
  onBellPress,
  onAvatarPress,
  onSearchPress,
}: TopBarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onAvatarPress} style={styles.avatarWrap}>
        {avatarSource && <Image source={avatarSource} style={styles.avatar} />}
      </TouchableOpacity>

      {showSearch ? (
        <TouchableOpacity onPress={onSearchPress} style={styles.searchBar} activeOpacity={0.7}>
          <Text style={styles.searchText}>Buscar plantas, dicas...</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}

      <TouchableOpacity onPress={onBellPress} style={styles.bellWrap}>
        <Text style={styles.bellIcon}>🔔</Text>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.greenLeaf,
    borderWidth: 2.5,
    borderColor: '#fff',
    // aro verde externo simulado com shadow
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  searchBar: {
    flex: 1,
    height: 42,
    borderRadius: 100,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.divider,
  },
  searchText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: SIZES.body,
    color: COLORS.inkMute,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xl,
    color: COLORS.greenDark,
  },
  bellWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.divider,
  },
  bellIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.coral,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 10,
    color: '#fff',
  },
});
