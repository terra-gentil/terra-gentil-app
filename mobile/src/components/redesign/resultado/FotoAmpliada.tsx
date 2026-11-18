import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { COLORS, FONTS } from "../../../constants/theme";
import { useReduzirMovimento } from "../../../hooks/useReduzirMovimento";
import {
  MarcaLupa,
  Tamanho2D,
  Zoom,
  caixaNaTela,
  exibidaContain,
  limitarZoom,
  zoomNaArea,
} from "./derivar";
import { COR, fonte } from "./comum";

interface Props {
  visivel: boolean;
  imageUri: string;
  marcas: MarcaLupa[];
  // Nome curto de cada problema, pelo indice em problemas_detectados
  rotulos: Record<number, string>;
  // Problema em que a foto abre aproximada (null = foto inteira)
  inicial: number | null;
  onFechar: () => void;
}

const SEM_ZOOM: Zoom = { escala: 1, x: 0, y: 0 };
const ZOOM_TOQUE_DUPLO = 2.5;
const INTERVALO_TOQUE_DUPLO_MS = 300;

const distancia = (t: { pageX: number; pageY: number }[]) =>
  Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);

// Foto do laudo em tela cheia: abre aproximada na marca do problema, com botoes grandes
// para ir de um problema a outro (publico mais velho) e pinca, arrasto e toque duplo.
// So JS (PanResponder + Animated): chega por OTA, sem modulo nativo novo.
export default function FotoAmpliada({ visivel, imageUri, marcas, rotulos, inicial, onFechar }: Props) {
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  const [tela, setTela] = useState<Tamanho2D | null>(null);
  const [imagem, setImagem] = useState<Tamanho2D | null>(null);
  const [foco, setFoco] = useState<number | null>(inicial);

  const escala = useRef(new Animated.Value(1)).current;
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const atual = useRef<Zoom>(SEM_ZOOM);
  const gesto = useRef<{ inicio: Zoom; dist0: number; dedos: number }>({ inicio: SEM_ZOOM, dist0: 0, dedos: 0 });
  const ultimoToque = useRef(0);

  useEffect(() => {
    if (!visivel || imagem) return;
    Image.getSize(
      imageUri,
      (largura, altura) => setImagem({ largura, altura }),
      () => {},
    );
  }, [visivel, imageUri, imagem]);

  const exibida = useMemo(() => (tela && imagem ? exibidaContain(tela, imagem) : null), [tela, imagem]);

  const aplicar = useCallback(
    (z: Zoom, animar: boolean) => {
      atual.current = z;
      if (!animar || reduzir) {
        escala.setValue(z.escala);
        x.setValue(z.x);
        y.setValue(z.y);
        return;
      }
      Animated.parallel([
        Animated.timing(escala, { toValue: z.escala, duration: 320, useNativeDriver: true }),
        Animated.timing(x, { toValue: z.x, duration: 320, useNativeDriver: true }),
        Animated.timing(y, { toValue: z.y, duration: 320, useNativeDriver: true }),
      ]).start();
    },
    [escala, x, y, reduzir],
  );

  const irPara = useCallback(
    (indice: number | null, animar = true) => {
      setFoco(indice);
      const marca = marcas.find((m) => m.indice === indice);
      if (!marca || !tela || !imagem) return aplicar(SEM_ZOOM, animar);
      aplicar(zoomNaArea(marca.area, tela, imagem), animar);
    },
    [marcas, tela, imagem, aplicar],
  );

  // Ao abrir (e quando a foto e a tela ficam conhecidas), vai direto ao problema escolhido
  useEffect(() => {
    if (visivel && tela && imagem) irPara(inicial, false);
  }, [visivel, tela, imagem]); // eslint-disable-line react-hooks/exhaustive-deps

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const toques = e.nativeEvent.touches;
          gesto.current = {
            inicio: atual.current,
            dist0: toques.length >= 2 ? distancia(toques as any) : 0,
            dedos: toques.length,
          };
        },
        onPanResponderMove: (e, g) => {
          if (!tela || !exibida) return;
          const toques = e.nativeEvent.touches;
          // Segundo dedo chegou depois: recomeca a pinca dali
          if (toques.length >= 2 && gesto.current.dedos < 2) {
            gesto.current = { inicio: atual.current, dist0: distancia(toques as any), dedos: 2 };
            return;
          }
          const { inicio, dist0 } = gesto.current;
          let z: Zoom;
          if (toques.length >= 2 && dist0 > 0) {
            const fator = distancia(toques as any) / dist0;
            z = { escala: inicio.escala * fator, x: inicio.x * fator, y: inicio.y * fator };
          } else if (gesto.current.dedos < 2) {
            z = { escala: inicio.escala, x: inicio.x + g.dx, y: inicio.y + g.dy };
          } else {
            return;
          }
          const limitado = limitarZoom(z, tela, exibida);
          atual.current = limitado;
          escala.setValue(limitado.escala);
          x.setValue(limitado.x);
          y.setValue(limitado.y);
        },
        onPanResponderRelease: (_e, g) => {
          const parado = Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6 && gesto.current.dedos < 2;
          if (!parado || !tela || !exibida) return;
          const agora = Date.now();
          if (agora - ultimoToque.current < INTERVALO_TOQUE_DUPLO_MS) {
            ultimoToque.current = 0;
            setFoco(null);
            const z =
              atual.current.escala > 1.2
                ? SEM_ZOOM
                : limitarZoom({ escala: ZOOM_TOQUE_DUPLO, x: 0, y: 0 }, tela, exibida);
            aplicar(z, true);
          } else {
            ultimoToque.current = agora;
          }
        },
      }),
    [tela, exibida, aplicar, escala, x, y],
  );

  const fechar = () => {
    aplicar(SEM_ZOOM, false);
    onFechar();
  };

  return (
    <Modal visible={visivel} animationType="fade" onRequestClose={fechar} statusBarTranslucent>
      <View testID="foto-ampliada" style={styles.fundo}>
        <View style={[styles.topo, { paddingTop: insets.top + 8 }]}>
          <Text style={[fonte(FONTS.bodyBold, 18, 1.2, "#fff"), { flex: 1 }]}>Sua foto</Text>
          <Pressable
            testID="fechar-foto-ampliada"
            onPress={fechar}
            accessibilityRole="button"
            accessibilityLabel="Fechar a foto"
            style={styles.botaoFechar}
          >
            <X size={22} color={COLORS.greenDark} strokeWidth={2.6} />
            <Text style={fonte(FONTS.bodyExtraBold, 17, 1.1, COLORS.greenDark)}>Fechar</Text>
          </Pressable>
        </View>

        <View
          style={styles.area}
          onLayout={(e: LayoutChangeEvent) => {
            const { width, height } = e.nativeEvent.layout;
            setTela({ largura: width, altura: height });
          }}
          {...responder.panHandlers}
        >
          {!!exibida && !!tela && (
            <Animated.View
              style={{
                width: exibida.largura,
                height: exibida.altura,
                transform: [{ translateX: x }, { translateY: y }, { scale: escala }],
              }}
            >
              <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />
              {!!imagem &&
                marcas.map((m) => {
                  const r = caixaNaTela(m.area, exibida, imagem, 4, "contain");
                  if (!r) return null;
                  const ativa = foco === m.indice;
                  return (
                    <View
                      key={m.indice}
                      testID={`marca-ampliada-${m.numero}`}
                      pointerEvents="none"
                      style={[
                        styles.marca,
                        r,
                        { borderRadius: Math.max(Math.min(r.width, r.height) / 2, 18), borderWidth: ativa ? 4 : 3 },
                      ]}
                    >
                      <View style={styles.numero}>
                        <Text style={fonte(FONTS.bodyExtraBold, 13, 1, "#fff")}>{m.numero}</Text>
                      </View>
                    </View>
                  );
                })}
            </Animated.View>
          )}
        </View>

        <View style={[styles.rodape, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={[fonte(FONTS.bodySemiBold, 15, 1.4, "rgba(255,255,255,0.85)"), styles.dica]}>
            Use dois dedos para aproximar, ou toque duas vezes na foto
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.botoes}>
            {marcas.map((m) => (
              <BotaoFoco
                key={m.indice}
                testID={`ver-problema-${m.numero}`}
                ativo={foco === m.indice}
                onPress={() => irPara(m.indice)}
                numero={m.numero}
                texto={rotulos[m.indice] || `Problema ${m.numero}`}
              />
            ))}
            <BotaoFoco testID="ver-foto-inteira" ativo={foco === null} onPress={() => irPara(null)} texto="Foto inteira" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function BotaoFoco({
  testID,
  ativo,
  onPress,
  texto,
  numero,
}: {
  testID: string;
  ativo: boolean;
  onPress: () => void;
  texto: string;
  numero?: number;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      style={[styles.botao, ativo && styles.botaoAtivo]}
    >
      {numero !== undefined && (
        <View style={styles.numeroBotao}>
          <Text style={fonte(FONTS.bodyExtraBold, 14, 1, "#fff")}>{numero}</Text>
        </View>
      )}
      <Text numberOfLines={1} style={[fonte(FONTS.bodyExtraBold, 17, 1.2, ativo ? COLORS.greenDark : "#fff"), { maxWidth: 220 }]}>
        {texto}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: "#111" },
  topo: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8 },
  botaoFechar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  area: { flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  marca: { position: "absolute", borderColor: COR.coral },
  numero: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COR.coral,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  rodape: { paddingTop: 10, gap: 10 },
  dica: { textAlign: "center", paddingHorizontal: 16 },
  botoes: { paddingHorizontal: 16, gap: 10 },
  botao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  botaoAtivo: { backgroundColor: "#fff", borderColor: "#fff" },
  numeroBotao: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COR.coral,
    alignItems: "center",
    justifyContent: "center",
  },
});
