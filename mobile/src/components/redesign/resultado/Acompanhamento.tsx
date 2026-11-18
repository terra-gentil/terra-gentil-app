import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bell, CalendarCheck, Check } from "lucide-react-native";
import { Acompanhamento as DadosAcompanhamento } from "../../../api/diagnostico";
import { COLORS, FONTS } from "../../../constants/theme";
import { textoPronto } from "../../../notificacoes/avisos";
import { PlantaRef, agendarRetorno, cancelarRetorno, plantaEmCuidado } from "../../../storage/plantasEmCuidado";
import { usePermissaoAvisos } from "../PermissaoAvisos";
import { COR, T, cartao, fonte } from "./comum";

interface Props {
  dados: DadosAcompanhamento;
  planta: PlantaRef;
  // v1: frase de retorno quando nao ha bloco de acompanhamento
  mensagemRetorno?: string;
}

// Bloco 10: prazo, sinais de melhora e piora, como evitar e "Me avise em N dias".
// O aviso marcado fica salvo na lista de plantas em cuidado e volta ao reabrir o laudo.
export default function Acompanhamento({ dados, planta, mensagemRetorno }: Props) {
  const dias = dados.retorno_em_dias || 0;
  const [lembrete, setLembrete] = useState<Date | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [agendando, setAgendando] = useState(false);
  const { garantir, folha } = usePermissaoAvisos();
  const melhora = dados.sinais_melhora || [];
  const piora = dados.sinais_piora || [];

  useEffect(() => {
    let ativo = true;
    plantaEmCuidado(planta.chave).then((p) => {
      if (ativo && p?.retornoNotifId && p.proximoRetorno && p.proximoRetorno > Date.now()) {
        setLembrete(new Date(p.proximoRetorno));
      }
    });
    return () => {
      ativo = false;
    };
  }, [planta.chave]);

  async function agendar() {
    if (agendando) return;
    setAgendando(true);
    setAviso(null);
    try {
      if (!(await garantir())) {
        setAviso(`Sem permissão de aviso, tudo bem. Se mudar de ideia, ligue as notificações do Terra Gentil nas configurações do celular. Ou volte aqui em ${dias} dias e tire uma nova foto.`);
        return;
      }
      setLembrete(await agendarRetorno(planta, dias));
    } catch (err) {
      console.log("[resultado] erro ao agendar lembrete:", err);
      setAviso("Não consegui marcar o aviso agora. Tente de novo daqui a pouco.");
    } finally {
      setAgendando(false);
    }
  }

  async function desfazer() {
    setLembrete(null);
    try {
      await cancelarRetorno(planta.chave);
    } catch (err) {
      console.log("[resultado] erro ao cancelar lembrete:", err);
    }
  }

  return (
    <View testID="acompanhamento" style={[cartao.base, styles.caixa]}>
      <Text style={T.h3}>Acompanhamento</Text>
      {!!dados.prazo_melhora && <Text style={fonte(FONTS.bodyMedium, 16, 1.5)}>{dados.prazo_melhora}</Text>}
      {!dados.prazo_melhora && !!mensagemRetorno && <Text style={fonte(FONTS.bodyMedium, 16, 1.5)}>{mensagemRetorno}</Text>}

      {melhora.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={[T.rotulo, { color: COLORS.greenDeep }]}>Sinais de que está melhorando</Text>
          {melhora.map((x, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.bolinha, { backgroundColor: COLORS.greenSoft }]}>
                <Check size={14} color={COLORS.greenDeep} strokeWidth={3.2} />
              </View>
              <Text style={[T.corpoInk, { flex: 1 }]}>{x}</Text>
            </View>
          ))}
        </View>
      )}

      {piora.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={[T.rotulo, { color: COR.rosaTexto }]}>Sinais de que piorou</Text>
          {piora.map((x, i) => (
            <View key={i} style={styles.item}>
              <View style={[styles.bolinha, { backgroundColor: COLORS.coralSoft }]}>
                <Text style={fonte(FONTS.displayBlack, 15, 1, COR.rosaTexto)}>!</Text>
              </View>
              <Text style={[T.corpoInk, { flex: 1 }]}>{x}</Text>
            </View>
          ))}
        </View>
      )}

      {!!dados.como_evitar && (
        <View style={styles.evitar}>
          <Text style={[T.rotulo, { color: COLORS.greenDark }]}>Para não voltar</Text>
          <Text style={T.corpoInk}>{dados.como_evitar}</Text>
        </View>
      )}

      {dias > 0 && !lembrete && (
        <TouchableOpacity
          testID="botao-me-avise"
          onPress={agendar}
          disabled={agendando}
          activeOpacity={0.85}
          style={styles.botaoAvise}
        >
          <Bell size={22} color={COLORS.greenDeep} strokeWidth={2.3} />
          <Text style={styles.botaoAviseTexto}>Me avise em {dias} dias</Text>
        </TouchableOpacity>
      )}
      {lembrete && (
        <View testID="lembrete-combinado" style={styles.combinado}>
          <CalendarCheck size={22} color={COLORS.greenDeep} strokeWidth={2.3} />
          <Text style={styles.combinadoTexto}>{textoPronto(lembrete)}</Text>
          <TouchableOpacity onPress={desfazer} style={styles.desfazer} accessibilityRole="button">
            <Text style={styles.desfazerTexto}>Desfazer</Text>
          </TouchableOpacity>
        </View>
      )}
      {!!aviso && (
        <Text testID="aviso-lembrete" style={styles.aviso}>
          {aviso}
        </Text>
      )}
      {folha}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { padding: 16, gap: 14 },
  item: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bolinha: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1 },
  evitar: { backgroundColor: COLORS.bg, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  botaoAvise: {
    height: 54,
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  botaoAviseTexto: fonte(FONTS.displayBlack, 17, 1.2, COLORS.greenDeep),
  combinado: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: COLORS.greenSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingRight: 8,
    paddingLeft: 14,
  },
  combinadoTexto: { flex: 1, ...fonte(FONTS.bodyExtraBold, 16, 1.3, COLORS.greenDark) },
  desfazer: { minHeight: 44, paddingHorizontal: 12, justifyContent: "center" },
  desfazerTexto: { ...fonte(FONTS.bodyBold, 15, 1.2, COLORS.greenDeep), textDecorationLine: "underline" },
  aviso: {
    ...fonte(FONTS.body, 15, 1.5, COR.ambarTexto),
    backgroundColor: COLORS.amberSoft,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
});
