import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Eye } from "lucide-react-native";
import { ProblemaDetectado } from "../../../api/diagnostico";
import { COLORS, FONTS } from "../../../constants/theme";
import { GRAVIDADE } from "./derivar";
import { COR, Chevron, T, cartao, fonte } from "./comum";

interface Props {
  problema: ProblemaDetectado;
  aberto: boolean;
  onAlternar: () => void;
}

// Bloco 8: um problema encontrado, com evidencia, causa e como confirmar
export default function CartaoProblema({ problema: p, aberto, onAlternar }: Props) {
  const [rotulo, bg, fg] = GRAVIDADE[p.gravidade] || GRAVIDADE.media;
  return (
    <View style={[cartao.base, { borderRadius: 20, overflow: "hidden" }]}>
      <TouchableOpacity onPress={onAlternar} activeOpacity={0.8} style={styles.cabecalho}>
        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <Text style={fonte(FONTS.displayBold, 18, 1.25)}>{p.descricao}</Text>
          <View style={styles.pilulas}>
            <View style={[styles.pilula, { backgroundColor: bg }]}>
              <Text style={fonte(FONTS.bodyBold, 15, 1.2, fg)}>{rotulo}</Text>
            </View>
            {p.contagioso && (
              <View style={[styles.pilula, { backgroundColor: COR.linha }]}>
                <Text style={fonte(FONTS.bodyBold, 15, 1.2, COR.texto2)}>Passa para outras plantas</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ marginTop: 2 }}>
          <Chevron aberto={aberto} tamanho={22} />
        </View>
      </TouchableOpacity>
      {aberto && (
        <View style={styles.corpo}>
          {!!p.evidencia_visual && (
            <View style={styles.evidencia}>
              <Eye size={20} color={COLORS.greenDeep} strokeWidth={2.2} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[T.rotulo, { color: COLORS.greenDark }]}>O que vi na foto</Text>
                <Text style={T.corpoInk}>{p.evidencia_visual}</Text>
              </View>
            </View>
          )}
          {!!p.causa_provavel && (
            <View style={{ gap: 2 }}>
              <Text style={T.rotulo}>Causa provável</Text>
              <Text style={T.corpo}>{p.causa_provavel}</Text>
            </View>
          )}
          {!!p.como_confirmar && (
            <View style={{ gap: 2 }}>
              <Text style={T.rotulo}>Para confirmar</Text>
              <Text style={T.corpo}>{p.como_confirmar}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: { minHeight: 44, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  pilulas: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pilula: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100 },
  corpo: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  evidencia: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 14, backgroundColor: COLORS.bg },
});
