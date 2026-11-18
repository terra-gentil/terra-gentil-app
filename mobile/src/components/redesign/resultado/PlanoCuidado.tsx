import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PassoTratamento } from "../../../api/diagnostico";
import { COLORS, FONTS } from "../../../constants/theme";
import { TIPO_LABEL } from "./derivar";
import { COR, Chevron, T, cartao, fonte } from "./comum";

interface Props {
  caseiros: PassoTratamento[];
  quimicos: PassoTratamento[];
}

// Bloco 9: plano em dois degraus. O quimico fica sempre recolhido, em ambar,
// so com o principio ativo, sem link e sem marca.
export default function PlanoCuidado({ caseiros, quimicos }: Props) {
  // Primeiro passo ja abre; os outros e o quimico comecam fechados
  const [abertos, setAbertos] = useState<Record<number, boolean>>({ 0: true });
  const [quimicoAberto, setQuimicoAberto] = useState(false);

  return (
    <>
      {caseiros.length > 0 && (
        <View style={[cartao.base, styles.caixa]}>
          <View style={styles.cabecalho}>
            <View style={styles.pilulaCaseiro}>
              <Text style={styles.pilulaCaseiroTexto}>Caseiro</Text>
            </View>
            <Text style={styles.comece}>Comece por aqui</Text>
          </View>
          {caseiros.map((s, i) => {
            const aberto = !!abertos[i];
            const temDetalhe = !!s.como_fazer || !!s.por_que || (s.materiais || []).length > 0;
            const ultimo = i === caseiros.length - 1;
            const tipo = TIPO_LABEL[s.tipo || "manejo"] || "Manejo";
            return (
              <View key={i} style={styles.passo}>
                <View style={styles.trilho}>
                  <View style={styles.numero}>
                    <Text style={styles.numeroTexto}>{i + 1}</Text>
                  </View>
                  <View style={[styles.linhaTrilho, ultimo && { opacity: 0 }]} />
                </View>
                <View style={styles.passoCorpo}>
                  <TouchableOpacity
                    disabled={!temDetalhe}
                    onPress={() => setAbertos((a) => ({ ...a, [i]: !aberto }))}
                    activeOpacity={0.8}
                    style={styles.passoBotao}
                  >
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={styles.etapa}>
                        {s.etapa}
                        {s.tipo ? ` · ${tipo}` : ""}
                      </Text>
                      <Text style={styles.acao}>{s.acao}</Text>
                    </View>
                    {temDetalhe && <Chevron aberto={aberto} />}
                  </TouchableOpacity>
                  {aberto && temDetalhe && (
                    <View style={styles.detalhe}>
                      {!!s.como_fazer && <Text style={[T.corpo, { lineHeight: 23 }]}>{s.como_fazer}</Text>}
                      {!!s.por_que && (
                        <Text style={styles.porQue}>
                          <Text style={{ fontFamily: FONTS.bodyExtraBold }}>Por que ajuda: </Text>
                          {s.por_que}
                        </Text>
                      )}
                      {(s.materiais || []).length > 0 && (
                        <View style={styles.materiais}>
                          {(s.materiais || []).map((m, k) => (
                            <View key={k} style={styles.material}>
                              <Text style={styles.materialTexto}>{m}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {quimicos.length > 0 && (
        <View testID="plano-quimico" style={styles.quimico}>
          <TouchableOpacity
            testID="botao-quimico"
            onPress={() => setQuimicoAberto((v) => !v)}
            activeOpacity={0.85}
            style={styles.quimicoBotao}
            accessibilityState={{ expanded: quimicoAberto }}
          >
            <View style={styles.pilulaQuimico}>
              <Text style={styles.pilulaQuimicoTexto}>Se não resolver</Text>
            </View>
            <Text style={styles.quimicoResumo}>Produto, só se o caseiro não bastar</Text>
            <Chevron aberto={quimicoAberto} cor={COR.ambarTexto} />
          </TouchableOpacity>
          {quimicoAberto && (
            <View testID="plano-quimico-aberto" style={styles.quimicoCorpo}>
              {quimicos.map((q, i) => (
                <View key={i} style={{ gap: 8 }}>
                  <Text style={fonte(FONTS.bodyExtraBold, 15, 1.2, COR.ambarForte)}>{q.etapa}</Text>
                  <Text style={styles.acao}>{q.acao}</Text>
                  {!!(q.materiais || [])[0] && (
                    <View style={styles.principio}>
                      <Text style={fonte(FONTS.bodyExtraBold, 15, 1.3, COR.ambarTexto)}>Princípio ativo</Text>
                      <Text style={fonte(FONTS.bodySemiBold, 15, 1.4)}>{(q.materiais || [])[0]}</Text>
                    </View>
                  )}
                  {!!q.como_fazer && <Text style={[T.corpo, { lineHeight: 23 }]}>{q.como_fazer}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  caixa: { paddingTop: 14, paddingHorizontal: 14, paddingBottom: 6 },
  cabecalho: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 2, paddingBottom: 10 },
  pilulaCaseiro: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 100, backgroundColor: COLORS.greenSoft },
  pilulaCaseiroTexto: fonte(FONTS.bodyExtraBold, 15, 1.2, COLORS.greenDark),
  comece: fonte(FONTS.bodyMedium, 15, 1.3, COLORS.inkSoft),
  passo: { flexDirection: "row", gap: 12 },
  trilho: { width: 32, alignItems: "center" },
  numero: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.green, alignItems: "center", justifyContent: "center" },
  numeroTexto: fonte(FONTS.displayBlack, 16, 1.2, "#fff"),
  linhaTrilho: { flex: 1, width: 2, backgroundColor: COLORS.greenSoft, marginVertical: 4 },
  passoCorpo: { flex: 1, minWidth: 0, paddingBottom: 12 },
  passoBotao: { minHeight: 44, paddingTop: 4, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  etapa: fonte(FONTS.bodyExtraBold, 15, 1.2, COLORS.greenDeep),
  acao: fonte(FONTS.bodyBold, 16, 1.4),
  detalhe: { gap: 10, paddingTop: 8 },
  porQue: {
    ...fonte(FONTS.body, 15, 1.5, COLORS.greenDark),
    backgroundColor: COR.verdeFundo,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  materiais: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  material: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COR.linha },
  materialTexto: fonte(FONTS.bodySemiBold, 15, 1.2, COR.texto2),
  quimico: { backgroundColor: COR.ambarFundo, borderWidth: 1.5, borderColor: COR.ambarBorda, borderRadius: 22, overflow: "hidden" },
  quimicoBotao: { minHeight: 56, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  pilulaQuimico: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 100, backgroundColor: COLORS.amber },
  pilulaQuimicoTexto: fonte(FONTS.bodyExtraBold, 15, 1.2),
  quimicoResumo: { flex: 1, ...fonte(FONTS.bodyMedium, 15, 1.3, COR.ambarTexto) },
  quimicoCorpo: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  principio: { backgroundColor: "#fff", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, gap: 2 },
});
