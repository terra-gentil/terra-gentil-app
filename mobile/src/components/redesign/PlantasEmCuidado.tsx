import React, { useCallback, useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Camera, Droplets, FileText, HeartPulse } from "lucide-react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { ddmm } from "../../notificacoes/avisos";
import { PlantaEmCuidado, listarPlantasEmCuidado, pararCuidados, proximaRega, renovarRegas } from "../../storage/plantasEmCuidado";
import { ESTADO } from "./resultado/derivar";
import { COR, cartao, fonte } from "./resultado/comum";

interface Props {
  // Muda a cada foco da Home para recarregar a lista
  gatilho: number;
  onVerLaudo: (consultaId: string) => void;
  onFotoRetorno: () => void;
}

export function textoRetorno(ts: number, agora: number = Date.now()): string {
  const hoje = new Date(agora);
  hoje.setHours(23, 59, 59, 999);
  if (ts <= hoje.getTime()) return "Hoje é dia de rever";
  return `Rever dia ${ddmm(new Date(ts))}`;
}

// Cartao da Home "Plantas em cuidado": tratamento em andamento e lembretes de rega
export default function PlantasEmCuidado({ gatilho, onVerLaudo, onFotoRetorno }: Props) {
  const [plantas, setPlantas] = useState<PlantaEmCuidado[]>([]);

  const carregar = useCallback(async () => {
    await renovarRegas();
    setPlantas(await listarPlantasEmCuidado());
  }, []);

  useEffect(() => {
    carregar();
  }, [gatilho, carregar]);

  const parar = useCallback(
    (p: PlantaEmCuidado) => {
      Alert.alert("Parar os avisos?", `Tiro ${p.nome_popular} da lista e cancelo os lembretes dela.`, [
        { text: "Voltar", style: "cancel" },
        {
          text: "Parar avisos",
          style: "destructive",
          onPress: async () => {
            await pararCuidados(p.chave);
            await carregar();
          },
        },
      ]);
    },
    [carregar],
  );

  if (plantas.length === 0) return null;

  return (
    <View testID="plantas-em-cuidado" style={styles.secao}>
      <View style={styles.titulo}>
        <HeartPulse size={22} color={COLORS.coralDeep} strokeWidth={2.4} />
        <Text style={fonte(FONTS.displayBlack, 20, 1.2, COLORS.greenDark)}>Plantas em cuidado</Text>
      </View>
      {plantas.map((p) => {
        const [rotulo, fundo, cor] = ESTADO[p.estado_saude] || ESTADO.atencao;
        return (
          <View key={p.chave} testID={`planta-cuidado-${p.chave}`} style={[cartao.base, styles.item]}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={styles.foto}>
                {!!p.imageUri && <Image source={{ uri: p.imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={fonte(FONTS.displayBlack, 18, 1.2)} numberOfLines={1}>
                  {p.nome_popular}
                </Text>
                <View style={[styles.chip, { backgroundColor: fundo }]}>
                  <Text style={fonte(FONTS.bodyExtraBold, 15, 1.2, cor)}>{rotulo}</Text>
                </View>
                {p.emTratamento && !!p.proximoRetorno && (
                  <Text style={fonte(FONTS.bodyBold, 15, 1.3, COR.ambarTexto)}>{textoRetorno(p.proximoRetorno)}</Text>
                )}
                {!!p.rega && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Droplets size={16} color={COLORS.skyDeep} strokeWidth={2.4} />
                    <Text style={fonte(FONTS.bodySemiBold, 15, 1.3, COLORS.skyDeep)}>Próxima rega {ddmm(proximaRega(p.rega))}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.botoes}>
              {!!p.consultaId && (
                <TouchableOpacity testID="botao-ver-laudo" onPress={() => onVerLaudo(p.consultaId as string)} activeOpacity={0.85} style={[styles.botao, styles.secundario]}>
                  <FileText size={20} color={COLORS.greenDark} strokeWidth={2.3} />
                  <Text style={fonte(FONTS.bodyExtraBold, 15, 1.2, COLORS.greenDark)}>Ver laudo</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity testID="botao-foto-retorno" onPress={onFotoRetorno} activeOpacity={0.85} style={[styles.botao, styles.primario]}>
                <Camera size={20} color="#fff" strokeWidth={2.3} />
                <Text style={[fonte(FONTS.bodyExtraBold, 15, 1.2, "#fff"), { flexShrink: 1, textAlign: "center" }]}>Tirar foto de retorno</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity testID="botao-parar-avisos" onPress={() => parar(p)} style={styles.parar} accessibilityRole="button">
              <Text style={[fonte(FONTS.bodyBold, 15, 1.2, COLORS.inkSoft), { textDecorationLine: "underline" }]}>Parar avisos</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { marginHorizontal: 16, marginBottom: 18, gap: 10 },
  titulo: { flexDirection: "row", alignItems: "center", gap: 8 },
  item: { padding: 14, gap: 12 },
  foto: { width: 72, height: 72, borderRadius: 16, overflow: "hidden", backgroundColor: COR.bege },
  chip: { alignSelf: "flex-start", borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  botoes: { flexDirection: "row", gap: 8 },
  botao: { flex: 1, minHeight: 54, borderRadius: 14, paddingVertical: 6, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 8 },
  primario: { backgroundColor: COLORS.green },
  secundario: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: COR.borda },
  parar: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
});
