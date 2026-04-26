import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageSourcePropType } from 'react-native';
import { COLORS, FONTS, SIZES, shadowSoft } from '../../constants/theme';

interface PlantCardProps {
  name: string;
  status: string;
  statusColor: string;
  timeAgo: string;
  imageUri?: string;
  gradientColors?: string[];
  onPress?: () => void;
}

export default function PlantCard({
  name,
  status,
  statusColor,
  timeAgo,
  imageUri,
  onPress,
}: PlantCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <View style={[styles.imageWrap, { backgroundColor: statusColor + '30' }]}>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
        <View style={styles.statusPill}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    ...shadowSoft(),
  },
  imageWrap: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 10,
  },
  body: {
    padding: 12,
  },
  name: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.ink,
  },
  time: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    marginTop: 2,
  },
});
