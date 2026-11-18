import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BellRing, Droplets } from "lucide-react-native";
import { COLORS, FONTS } from "../../../constants/theme";
import { ddmm } from "../../../notificacoes/avisos";
import { PlantaRef, RegaAgendada, agendarRega, cancelarRega, plantaEmCuidado, proximaRega } from "../../../storage/plantasEmCuidado";
import { usePermissaoAvisos } from "../PermissaoAvisos";
import { COR, T, cartao, fonte } from "./comum";

interface Props {
  planta: PlantaRef;
  regaDias: number;
  regaMl?: number;
}

export function intervaloRega(dias: number): string {
  return dias <= 1 ? "todo dia" : `a cada ${dias} dias`;
}

// "Lembrar de regar": aviso local recorrente as 9h, com o nome da planta e os ml quando houver
export default function LembreteRega({ planta, regaDias, regaMl }: Props) {
  const [rega, setRega] = useState<RegaAgendada | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const { garantir, folha } = usePermissaoAvisos();

  useEffect(() => {
    let ativo = true;
    plantaEmCuidado(planta.chave).then((p) => {
      if (ativo && p?.rega) setRega(p.rega);
    });
    return () => {
      ativo = false;
    };
  }, [planta.chave]);

  async function ligar() {
    if (ocupado) return;
    setOcupado(true);
    setAviso(null);
    try {
      if (!(await garantir())) {
        setAviso("Sem permissão de aviso, tudo bem. Se mudar de ideia, ligue as notificações do Terra Gentil nas configurações do celular.");
        return;
      }
      await agendarRega(planta, regaDias, regaMl);
      const p = await plantaEmCuidado(planta.chave);
      setRega(p?.rega || null);
    } catch (err) {
      console.log("[resultado] erro ao agendar rega:", err);
      setAviso("Não consegui marcar o lembrete agora. Tente de novo daqui a pouco.");
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    setRega(null);
    try {
      await cancelarRega(planta.chave);
    } catch (err) {
      console.log("[resultado] erro ao cancelar rega:", err);
    }
  }

  const ml = regaMl && regaMl > 0 ? `cerca de ${regaMl} ml, ` : "";
  return (
    <View testID="lembrete-rega" style={[cartao.base, styles.caixa]}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <View style={styles.icone}>
          <Droplets size={22} color={COLORS.skyDeep} strokeWidth={2.3} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={T.h3}>Rega</Text>
          <Text style={T.corpo}>
            {ml}
            {intervaloRega(regaDias)}
          </Text>
        </View>
      </View>
      {!rega ? (
        <TouchableOpacity testID="botao-lembrar-regar" onPress={ligar} disabled={ocupado} activeOpacity={0.85} style={styles.botao}>
          <BellRing size={22} color={COLORS.skyDeep} strokeWidth={2.3} />
          <Text style={styles.botaoTexto}>Lembrar de regar</Text>
        </TouchableOpacity>
      ) : (
        <View testID="rega-combinada" style={styles.combinado}>
          <Text style={styles.combinadoTexto}>
            Pronto! Vou te lembrar de regar {intervaloRega(rega.dias)}, às 9h. Próximo aviso: {ddmm(proximaRega(rega))}.
          </Text>
          <TouchableOpacity testID="botao-cancelar-rega" onPress={desligar} style={styles.desfazer} accessibilityRole="button">
            <Text style={styles.desfazerTexto}>Cancelar lembrete</Text>
          </TouchableOpacity>
        </View>
      )}
      {!!aviso && (
        <Text testID="aviso-rega" style={styles.aviso}>
          {aviso}
        </Text>
      )}
      {folha}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { padding: 16, gap: 14 },
  icone: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.skySoft, alignItems: "center", justifyContent: "center" },
  botao: {
    height: 54,
    borderWidth: 2,
    borderColor: COLORS.sky,
    borderRadius: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  botaoTexto: fonte(FONTS.displayBlack, 17, 1.2, COLORS.skyDeep),
  combinado: { borderRadius: 16, backgroundColor: COLORS.skySoft, paddingVertical: 10, paddingHorizontal: 14, gap: 4 },
  combinadoTexto: fonte(FONTS.bodyExtraBold, 16, 1.4, COLORS.skyDeep),
  desfazer: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  desfazerTexto: { ...fonte(FONTS.bodyBold, 15, 1.2, COLORS.skyDeep), textDecorationLine: "underline" },
  aviso: {
    ...fonte(FONTS.body, 15, 1.5, COR.ambarTexto),
    backgroundColor: COLORS.amberSoft,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
});
