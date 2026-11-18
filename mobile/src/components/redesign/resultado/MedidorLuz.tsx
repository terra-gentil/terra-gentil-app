import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LightSensor } from "expo-sensors";
import { Sun } from "lucide-react-native";
import { COLORS, FONTS } from "../../../constants/theme";
import { FAIXAS_LUZ, FAIXA_EXPLICA, comparaLuz, faixaDaPlanta, faixaDoLux, mediana } from "./derivar";
import { COR, T, fonte } from "./comum";

const DURACAO_MS = 4000;

// Sensor de luz so existe no Android (e nem todo aparelho tem): sem ele o botao some
export function useSensorDeLuz(): boolean {
  const [disponivel, setDisponivel] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    let ativo = true;
    LightSensor.isAvailableAsync()
      .then((ok) => {
        if (ativo) setDisponivel(!!ok);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);
  return disponivel;
}

interface Props {
  visivel: boolean;
  nivelLuz: string;
  onFechar: () => void;
}

// Folha do medidor: le o sensor por alguns segundos e compara com o que a planta precisa
export default function MedidorLuz({ visivel, nivelLuz, onFechar }: Props) {
  const insets = useSafeAreaInsets();
  const [medindo, setMedindo] = useState(false);
  const [agora, setAgora] = useState<number | null>(null);
  const [resultado, setResultado] = useState<number | null>(null);
  const leituras = useRef<number[]>([]);
  const precisa = faixaDaPlanta(nivelLuz);

  const medir = useCallback(() => {
    leituras.current = [];
    setResultado(null);
    setAgora(null);
    setMedindo(true);
  }, []);

  useEffect(() => {
    if (visivel) medir();
  }, [visivel, medir]);

  useEffect(() => {
    if (!visivel || !medindo) return;
    LightSensor.setUpdateInterval(250);
    const sub = LightSensor.addListener(({ illuminance }) => {
      leituras.current.push(illuminance);
      setAgora(illuminance);
    });
    const t = setTimeout(() => {
      setResultado(mediana(leituras.current));
      setMedindo(false);
    }, DURACAO_MS);
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, [visivel, medindo]);

  if (!visivel) return null;
  const faixa = resultado !== null ? faixaDoLux(resultado) : null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
      <Pressable style={styles.fundo} onPress={onFechar} accessibilityLabel="Fechar" />
      <View testID="folha-medidor-luz" style={[styles.folha, { paddingBottom: 20 + insets.bottom }]}>
        <View style={styles.icone}>
          <Sun size={32} color="#b45309" strokeWidth={2.4} />
        </View>
        <Text style={[fonte(FONTS.displayBlack, 22, 1.2, COLORS.greenDark), { textAlign: "center" }]}>Medir a luz aqui</Text>
        {medindo ? (
          <View style={{ gap: 8 }}>
            <Text style={fonte(FONTS.bodyMedium, 18, 1.45)}>
              Segure o celular onde a planta fica, com a tela virada para cima, e espere uns segundos.
            </Text>
            <Text testID="lux-agora" style={fonte(FONTS.bodyBold, 16, 1.3, COLORS.inkSoft)}>
              {agora !== null ? `Lendo: ${Math.round(agora)} lux` : "Lendo..."}
            </Text>
          </View>
        ) : (
          faixa !== null && (
            <View testID="resultado-luz" style={{ gap: 10 }}>
              <View style={styles.faixas}>
                {FAIXAS_LUZ.map((f, i) => (
                  <View key={f} style={[styles.faixa, i === faixa && styles.faixaAtiva, i === precisa && styles.faixaPrecisa]}>
                    <Text style={fonte(FONTS.bodyExtraBold, 15, 1.2, i === faixa ? "#fff" : COLORS.ink)} numberOfLines={2}>
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
              {precisa !== null && (
                <Text style={fonte(FONTS.body, 15, 1.3, COLORS.inkSoft)}>Borda verde: o que a planta precisa.</Text>
              )}
              <Text style={fonte(FONTS.displayBlack, 20, 1.3)}>Aqui: {FAIXAS_LUZ[faixa]}</Text>
              <Text style={T.corpo}>
                {FAIXA_EXPLICA[faixa]} ({Math.round(resultado || 0)} lux)
              </Text>
              {precisa !== null && (
                <Text style={[fonte(FONTS.bodyBold, 17, 1.45, faixa === precisa ? COLORS.greenDeep : COR.ambarTexto)]}>
                  {comparaLuz(faixa, precisa)}
                </Text>
              )}
              <Text style={fonte(FONTS.body, 15, 1.4, COLORS.inkSoft)}>Meça em horas diferentes: a luz muda ao longo do dia.</Text>
            </View>
          )
        )}
        {!medindo && (
          <TouchableOpacity testID="botao-medir-de-novo" onPress={medir} activeOpacity={0.85} style={styles.botao}>
            <Text style={fonte(FONTS.displayBlack, 18, 1.2, "#fff")}>Medir de novo</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onFechar} activeOpacity={0.8} style={styles.secundario}>
          <Text style={[fonte(FONTS.bodyBold, 17, 1.2, COLORS.greenDeep), { textDecorationLine: "underline" }]}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: "rgba(28,25,23,0.45)" },
  folha: { backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 22, paddingHorizontal: 20, gap: 14 },
  icone: { alignSelf: "center", width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.amberSoft, alignItems: "center", justifyContent: "center" },
  faixas: { flexDirection: "row", gap: 6 },
  faixa: { flex: 1, minHeight: 52, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", padding: 4, borderWidth: 2, borderColor: "transparent" },
  faixaAtiva: { backgroundColor: COLORS.amber },
  faixaPrecisa: { borderColor: COLORS.green },
  botao: { minHeight: 56, borderRadius: 16, backgroundColor: COLORS.green, alignItems: "center", justifyContent: "center" },
  secundario: { minHeight: 48, alignItems: "center", justifyContent: "center" },
});
