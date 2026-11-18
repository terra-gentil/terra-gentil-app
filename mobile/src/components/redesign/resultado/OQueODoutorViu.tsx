import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sun } from "lucide-react-native";
import { LeituraFoto } from "../../../api/diagnostico";
import { COLORS, FONTS } from "../../../constants/theme";
import { ASPECTO_LABEL, SINAL } from "./derivar";
import { Chevron, T, cartao, fonte } from "./comum";
import MedidorLuz, { useSensorDeLuz } from "./MedidorLuz";

interface Props {
  leitura: LeituraFoto[];
  luzOnde: number;
  luzPrecisa: number | null;
  luzVeredito: string;
  abertoInicial: boolean;
  nivelLuz?: string;
}

// Bloco 14: leitura da foto por aspecto e regua de luz (onde esta x do que precisa)
export default function OQueODoutorViu({ leitura, luzOnde, luzPrecisa, luzVeredito, abertoInicial, nivelLuz = "" }: Props) {
  const [aberto, setAberto] = useState(abertoInicial);
  const [medidor, setMedidor] = useState(false);
  const temSensor = useSensorDeLuz();
  const temRegua = luzPrecisa !== null;
  return (
    <View testID="o-que-o-doutor-viu" style={[cartao.base, styles.caixa]}>
      <TouchableOpacity style={styles.cabecalho} onPress={() => setAberto((v) => !v)} activeOpacity={0.8}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={fonte(FONTS.displayBlack, 19, 1.2, COLORS.greenDark)}>O que o Doutor viu</Text>
          <Text style={fonte(FONTS.body, 15, 1.3, COLORS.inkSoft)}>Folhas, ambiente e luz da foto</Text>
        </View>
        <Chevron aberto={aberto} texto />
      </TouchableOpacity>
      {aberto && (
        <View style={styles.corpo}>
          {leitura.slice(0, 3).map((l, i) => {
            const [rotulo, cor, corTexto] = SINAL[l.sinal] || SINAL.atencao;
            return (
              <View key={i} style={{ flexDirection: "row", gap: 10 }}>
                <View style={[styles.ponto, { backgroundColor: cor }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={T.rotulo}>
                    {ASPECTO_LABEL[l.aspecto] || l.aspecto}{" "}
                    <Text style={{ fontFamily: FONTS.bodySemiBold, color: corTexto }}>· {rotulo}</Text>
                  </Text>
                  <Text style={T.corpo}>{l.observacao}</Text>
                </View>
              </View>
            );
          })}
          {(temRegua || !!luzVeredito) && (
            <View style={styles.luz}>
              <Text style={T.rotulo}>Luz</Text>
              {temRegua && (
                <>
                  <View style={styles.regua}>
                    <LinearGradient
                      colors={["#57534e", "#a3b18a", "#fde68a", "#f59e0b"]}
                      locations={[0, 0.3, 0.65, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.faixa}
                    />
                    <View style={[styles.marcaOnde, { left: `${luzOnde}%` }]} />
                    <View style={[styles.marcaPrecisa, { left: `${luzPrecisa}%` }]} />
                  </View>
                  <View style={styles.legenda}>
                    <View style={styles.legendaItem}>
                      <View style={styles.legendaOnde} />
                      <Text style={fonte(FONTS.bodySemiBold, 15, 1.3)}>Onde está</Text>
                    </View>
                    <View style={styles.legendaItem}>
                      <View style={styles.legendaPrecisa} />
                      <Text style={fonte(FONTS.bodySemiBold, 15, 1.3, COLORS.greenDeep)}>Do que precisa</Text>
                    </View>
                  </View>
                </>
              )}
              {!!luzVeredito && <Text style={T.corpo}>{luzVeredito}</Text>}
            </View>
          )}
          {temSensor && (
            <TouchableOpacity testID="botao-medir-luz" onPress={() => setMedidor(true)} activeOpacity={0.85} style={styles.medir}>
              <Sun size={22} color="#b45309" strokeWidth={2.3} />
              <Text style={fonte(FONTS.displayBlack, 17, 1.2, "#92400e")}>Medir a luz aqui</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {temSensor && <MedidorLuz visivel={medidor} nivelLuz={nivelLuz} onFechar={() => setMedidor(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { paddingVertical: 4, paddingHorizontal: 16 },
  cabecalho: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  corpo: { gap: 14, paddingBottom: 16 },
  ponto: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  luz: { gap: 10, padding: 14, borderRadius: 16, backgroundColor: COLORS.bg },
  regua: { height: 56, justifyContent: "center", marginHorizontal: 9 },
  faixa: { height: 12, borderRadius: 6 },
  marcaOnde: {
    position: "absolute",
    top: 19,
    marginLeft: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: COLORS.ink,
  },
  marcaPrecisa: {
    position: "absolute",
    top: 17,
    marginLeft: -11,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.green,
    borderWidth: 4,
    borderColor: "#fff",
  },
  medir: {
    height: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.amber,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  legenda: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  legendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendaOnde: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: COLORS.ink },
  legendaPrecisa: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.green },
});
