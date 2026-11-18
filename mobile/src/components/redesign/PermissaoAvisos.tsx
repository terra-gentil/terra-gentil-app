import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Settings } from "lucide-react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { estadoPermissao, pedirAoSistema } from "../../notificacoes/avisos";
import { fonte } from "./resultado/comum";

type Etapa = "explicar" | "configuracoes" | null;

const PASSOS = [
  "Toque no botão abaixo.",
  "Toque em Notificações.",
  "Ligue a chave Permitir notificações.",
  "Volte para o app.",
];

// Conduz a permissao de notificacao passo a passo (publico idoso):
// folha propria explicando, pedido do sistema e, se bloqueado, caminho ate as configuracoes.
// Uso: const { garantir, folha } = usePermissaoAvisos(); if (await garantir()) agenda(); ... {folha}
export function usePermissaoAvisos() {
  const [etapa, setEtapa] = useState<Etapa>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const terminar = useCallback((ok: boolean) => {
    setEtapa(null);
    const r = resolver.current;
    resolver.current = null;
    r?.(ok);
  }, []);

  useEffect(() => () => {
    resolver.current?.(false);
    resolver.current = null;
  }, []);

  // Voltou das configuracoes: confere de novo e segue sozinho se liberou
  useEffect(() => {
    if (etapa !== "configuracoes") return;
    const sub = AppState.addEventListener("change", async (s) => {
      if (s !== "active") return;
      try {
        if ((await estadoPermissao()) === "liberada") terminar(true);
      } catch (err) {
        console.log("[permissao] erro ao conferir:", err);
      }
    });
    return () => sub.remove();
  }, [etapa, terminar]);

  const garantir = useCallback(async (): Promise<boolean> => {
    const st = await estadoPermissao();
    if (st === "liberada") return true;
    resolver.current?.(false);
    return new Promise<boolean>((res) => {
      resolver.current = res;
      setEtapa(st === "bloqueada" ? "configuracoes" : "explicar");
    });
  }, []);

  const continuar = useCallback(async () => {
    setEtapa(null);
    try {
      const st = await pedirAoSistema();
      if (st === "liberada") terminar(true);
      else if (st === "bloqueada") setEtapa("configuracoes");
      else terminar(false);
    } catch (err) {
      console.log("[permissao] erro no pedido:", err);
      terminar(false);
    }
  }, [terminar]);

  const abrirConfiguracoes = useCallback(() => {
    Linking.openSettings().catch((err) => console.log("[permissao] erro ao abrir configuracoes:", err));
  }, []);

  const folha = (
    <FolhaPermissao
      etapa={etapa}
      onContinuar={continuar}
      onAgoraNao={() => terminar(false)}
      onAbrirConfiguracoes={abrirConfiguracoes}
    />
  );
  return { garantir, folha, etapa };
}

function FolhaPermissao({
  etapa,
  onContinuar,
  onAgoraNao,
  onAbrirConfiguracoes,
}: {
  etapa: Etapa;
  onContinuar: () => void;
  onAgoraNao: () => void;
  onAbrirConfiguracoes: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!etapa) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onAgoraNao} statusBarTranslucent>
      <Pressable style={styles.fundo} onPress={onAgoraNao} accessibilityLabel="Fechar" />
      <View style={[styles.folha, { paddingBottom: 20 + insets.bottom }]}>
        <View style={styles.icone}>
          {etapa === "explicar" ? (
            <Bell size={34} color={COLORS.greenDeep} strokeWidth={2.4} />
          ) : (
            <Settings size={34} color={COLORS.greenDeep} strokeWidth={2.4} />
          )}
        </View>
        {etapa === "explicar" ? (
          <View testID="folha-permissao-explicar" style={{ gap: 18 }}>
            <Text style={styles.titulo}>Posso te avisar?</Text>
            <Text style={styles.texto}>
              Para eu te avisar, o celular vai perguntar se pode mandar notificações. Toque em{" "}
              <Text style={{ fontFamily: FONTS.bodyExtraBold, color: COLORS.greenDark }}>PERMITIR</Text>.
            </Text>
            <TouchableOpacity testID="botao-permissao-continuar" onPress={onContinuar} activeOpacity={0.85} style={styles.botao}>
              <Text style={styles.botaoTexto}>Entendi, continuar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View testID="folha-permissao-configuracoes" style={{ gap: 16 }}>
            <Text style={styles.titulo}>Falta ligar os avisos</Text>
            <Text style={styles.texto}>Os avisos estão desligados no celular. É rapidinho:</Text>
            <View style={{ gap: 12 }}>
              {PASSOS.map((p, i) => (
                <View key={i} style={styles.passo}>
                  <View style={styles.numero}>
                    <Text style={fonte(FONTS.displayBlack, 18, 1, "#fff")}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.texto, { flex: 1 }]}>{p}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity testID="botao-abrir-configuracoes" onPress={onAbrirConfiguracoes} activeOpacity={0.85} style={styles.botao}>
              <Text style={styles.botaoTexto}>Abrir configurações</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity testID="botao-permissao-agora-nao" onPress={onAgoraNao} activeOpacity={0.8} style={styles.secundario}>
          <Text style={styles.secundarioTexto}>Agora não</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: "rgba(28,25,23,0.45)" },
  folha: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 22,
    paddingHorizontal: 20,
    gap: 14,
  },
  icone: {
    alignSelf: "center",
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { ...fonte(FONTS.displayBlack, 24, 1.2, COLORS.greenDark), textAlign: "center" },
  texto: fonte(FONTS.bodyMedium, 19, 1.45, COLORS.ink),
  passo: { flexDirection: "row", alignItems: "center", gap: 12 },
  numero: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.green, alignItems: "center", justifyContent: "center" },
  botao: {
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: COLORS.greenDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  botaoTexto: fonte(FONTS.displayBlack, 20, 1.2, "#fff"),
  secundario: { minHeight: 52, alignItems: "center", justifyContent: "center" },
  secundarioTexto: { ...fonte(FONTS.bodyBold, 18, 1.2, COLORS.greenDeep), textDecorationLine: "underline" },
});
