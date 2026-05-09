import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../../constants/theme";

export interface FlashDeal {
  id: string;
  nome: string;
  precoDe: string;
  precoPor: string;
  desconto: string;
  vendido: number;
  gradient: [string, string];
}

export interface RecommendedDeal {
  id: string;
  nome: string;
  descricao: string;
  preco: string;
  tag: string;
  gradient: [string, string];
}

interface FlashCardProps {
  deal: FlashDeal;
  onPress?: () => void;
}

export function FlashDealCard({ deal, onPress }: FlashCardProps) {
  const progresso = Math.min(Math.max(deal.vendido, 0), 100);
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.flashCard}
    >
      <View style={styles.flashHero}>
        <LinearGradient
          colors={deal.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.flashDescontoPill}>
          <Text style={styles.flashDescontoText}>{deal.desconto}</Text>
        </View>
      </View>
      <View style={styles.flashBody}>
        <Text style={styles.flashNome} numberOfLines={2}>
          {deal.nome}
        </Text>
        <View style={styles.flashPrecoRow}>
          <Text style={styles.flashPrecoPor}>{deal.precoPor}</Text>
          <Text style={styles.flashPrecoDe}>{deal.precoDe}</Text>
        </View>
        <View style={styles.flashBarra}>
          <View style={[styles.flashBarraFill, { width: `${progresso}%` }]} />
        </View>
        <Text style={styles.flashVendido}>{progresso}% vendido</Text>
      </View>
    </TouchableOpacity>
  );
}

interface RecCardProps {
  deal: RecommendedDeal;
  onPress?: () => void;
  onAdd?: () => void;
}

export function RecommendedDealCard({ deal, onPress, onAdd }: RecCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.recCard}
    >
      <View style={styles.recImagemWrap}>
        <LinearGradient
          colors={deal.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <View style={styles.recBody}>
        <Text style={styles.recTag}>{deal.tag}</Text>
        <Text style={styles.recNome} numberOfLines={1}>
          {deal.nome}
        </Text>
        <Text style={styles.recDesc} numberOfLines={1}>
          {deal.descricao}
        </Text>
        <View style={styles.recRodape}>
          <Text style={styles.recPreco}>{deal.preco}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onAdd}
            hitSlop={8}
            style={styles.recPlusBtn}
          >
            <Plus size={20} color="#fff" strokeWidth={2.6} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Flash
  flashCard: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    ...shadowSoft(),
  },
  flashHero: {
    height: 110,
    position: "relative",
  },
  flashDescontoPill: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: COLORS.coral,
    ...shadowChunky(COLORS.coralDeep),
  },
  flashDescontoText: {
    fontFamily: FONTS.displayBlack,
    fontSize: 11,
    color: "#fff",
  },
  flashBody: {
    padding: 10,
  },
  flashNome: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.sm,
    color: COLORS.ink,
    lineHeight: 16,
    minHeight: 32,
  },
  flashPrecoRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 6,
  },
  flashPrecoPor: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.md,
    color: COLORS.coralDeep,
  },
  flashPrecoDe: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    textDecorationLine: "line-through",
  },
  flashBarra: {
    height: 4,
    backgroundColor: COLORS.divider,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  flashBarraFill: {
    height: "100%",
    backgroundColor: COLORS.coral,
  },
  flashVendido: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.inkSoft,
    marginTop: 4,
  },

  // Recomendado
  recCard: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    ...shadowSoft(),
  },
  recImagemWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
  },
  recBody: {
    flex: 1,
    justifyContent: "space-between",
  },
  recTag: {
    fontFamily: FONTS.displayBlack,
    fontSize: 10,
    color: COLORS.green,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  recNome: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: COLORS.ink,
    marginTop: 2,
  },
  recDesc: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  recRodape: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  recPreco: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.md,
    color: COLORS.greenDark,
  },
  recPlusBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    ...shadowChunky(COLORS.greenDeep),
  },
});
