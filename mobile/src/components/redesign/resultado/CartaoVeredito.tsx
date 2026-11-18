import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronDown } from "lucide-react-native";
import { DiagnosticoResponse } from "../../../api/diagnostico";
import { COLORS, FONTS } from "../../../constants/theme";
import { CATEGORIA_LABEL, estadoDe } from "./derivar";
import { COR, Chevron, fonte } from "./comum";
import FotoReferencia from "./FotoReferencia";

interface Props {
  imageUri: string;
  resultado: DiagnosticoResponse;
  temPlano: boolean;
  onVerPlano: () => void;
  onChipProblema: (indice: number) => void;
}

// Bloco 4: veredito com estado, nome, titulo, chips de causa e "Ver o plano"
export default function CartaoVeredito({ imageUri, resultado: r, temPlano, onVerPlano, onChipProblema }: Props) {
  const [reconheciAberto, setReconheciAberto] = useState(false);
  const [nomesAberto, setNomesAberto] = useState(false);
  const [rotulo, bg, fg] = estadoDe(r);
  const id = r.identificacao;
  const outrosNomes = id?.outros_nomes || [];

  // Um chip por categoria, na ordem dos problemas
  const vistas = new Set<string>();
  const chips: { label: string; leve: boolean; indice: number }[] = [];
  (r.problemas_detectados || []).forEach((p, i) => {
    if (!p.categoria || vistas.has(p.categoria)) return;
    vistas.add(p.categoria);
    chips.push({ label: CATEGORIA_LABEL[p.categoria] || p.categoria, leve: p.gravidade === "baixa", indice: i });
  });

  return (
    <View testID="cartao-veredito" style={styles.cartao}>
      <LinearGradient
        colors={["#16a34a", "#15803d", "#14532d"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: 26 }]}
      />
      <View style={styles.topo}>
        <Image source={{ uri: imageUri }} style={styles.miniatura} accessible={false} />
        <View style={styles.identidade}>
          <View testID="rotulo-estado" style={[styles.estado, { backgroundColor: bg }]}>
            <Text style={[styles.estadoTexto, { color: fg }]}>{rotulo}</Text>
          </View>
          <Text style={styles.nome}>{r.nome_popular}</Text>
          {!!r.especie_identificada && <Text style={styles.especie}>{r.especie_identificada}</Text>}
        </View>
      </View>

      {/* Foto de referencia da especie (Wikipedia); some se vier vazia ou falhar */}
      <FotoReferencia uri={r.foto_referencia} claro titulo="Foto de referência" tamanho={56} />

      {(!!r.diagnostico_titulo || !!r.diagnostico_explicacao) && (
        <View style={{ gap: 6 }}>
          {!!r.diagnostico_titulo && <Text style={styles.titulo}>{r.diagnostico_titulo}</Text>}
          {!!r.diagnostico_explicacao && <Text style={styles.explicacao}>{r.diagnostico_explicacao}</Text>}
        </View>
      )}

      {chips.length > 0 && (
        <View style={styles.chips}>
          {chips.map((c) => (
            <TouchableOpacity
              key={c.label}
              onPress={() => onChipProblema(c.indice)}
              activeOpacity={0.85}
              accessibilityRole="button"
              style={[styles.chip, { backgroundColor: c.leve ? "#fef3c7" : "#ffe1ec" }]}
            >
              <View style={[styles.chipPonto, { backgroundColor: c.leve ? "#f59e0b" : "#fb6f92" }]} />
              <Text style={[styles.chipTexto, { color: c.leve ? COR.ambarTexto : COR.rosaTexto }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {temPlano && (
        <TouchableOpacity testID="botao-ver-plano" onPress={onVerPlano} activeOpacity={0.85} style={styles.botaoPlano}>
          <Text style={styles.botaoPlanoTexto}>Ver o plano</Text>
          <ChevronDown size={20} color={COLORS.greenDark} strokeWidth={2.6} />
        </TouchableOpacity>
      )}

      {(!!id?.como_reconheci || outrosNomes.length > 0) && (
        <View style={styles.recolhiveis}>
          {!!id?.como_reconheci && (
            <>
              <TouchableOpacity style={styles.linhaRecolhe} onPress={() => setReconheciAberto((v) => !v)} activeOpacity={0.8}>
                <Text style={styles.linhaTexto}>Como reconheci</Text>
                <Chevron aberto={reconheciAberto} cor="#fff" />
              </TouchableOpacity>
              {reconheciAberto && <Text style={[styles.explicacao, { marginBottom: 12 }]}>{id.como_reconheci}</Text>}
            </>
          )}
          {outrosNomes.length > 0 && (
            <>
              <TouchableOpacity
                style={[styles.linhaRecolhe, !!id?.como_reconheci && styles.linhaDivisoria]}
                onPress={() => setNomesAberto((v) => !v)}
                activeOpacity={0.8}
              >
                <Text style={styles.linhaTexto}>Também conhecida como</Text>
                <Chevron aberto={nomesAberto} cor="#fff" />
              </TouchableOpacity>
              {nomesAberto && <Text style={[styles.explicacao, { marginBottom: 6 }]}>{outrosNomes.join(", ")}</Text>}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: 26,
    padding: 18,
    gap: 14,
    shadowColor: COLORS.greenDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    backgroundColor: COLORS.greenDeep,
  },
  topo: { flexDirection: "row", alignItems: "center", gap: 14 },
  miniatura: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: COLORS.greenSoft },
  identidade: { flex: 1, minWidth: 0, gap: 6 },
  estado: { alignSelf: "flex-start", paddingVertical: 5, paddingHorizontal: 12, borderRadius: 100 },
  estadoTexto: fonte(FONTS.bodyExtraBold, 15, 1.2),
  nome: fonte(FONTS.displayBlack, 28, 1.05, "#fff"),
  especie: { ...fonte(FONTS.bodyMedium, 15, 1.2, COLORS.greenSoft), fontStyle: "italic" },
  titulo: fonte(FONTS.displayBold, 19, 1.3, "#fff"),
  explicacao: fonte(FONTS.body, 15, 1.55, COR.verdeClaro),
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 100, flexDirection: "row", alignItems: "center", gap: 8 },
  chipPonto: { width: 8, height: 8, borderRadius: 4 },
  chipTexto: fonte(FONTS.bodyBold, 15, 1.2),
  botaoPlano: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0f3d22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  botaoPlanoTexto: fonte(FONTS.displayBlack, 17, 1.2, COLORS.greenDark),
  recolhiveis: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.18)" },
  linhaRecolhe: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  linhaDivisoria: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.18)" },
  linhaTexto: fonte(FONTS.bodyBold, 15, 1.3, "#fff"),
});
