import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
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
  Retangulo,
  Tamanho2D,
  Zoom,
  caixaNaTela,
  exibidaContain,
  limitarZoom,
  zoomNaArea,
} from "./derivar";
import { COR, fonte } from "./comum";
import { AnelMarca, EscurecerFora, EtiquetaMarca } from "./MarcaDesenho";

const FUNDO = "#0f2618";

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
  // Escala alvo do zoom: as bordas das marcas usam base / escala para ficarem com a mesma espessura na tela
  const [escalaAlvo, setEscalaAlvo] = useState(1);

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
      setEscalaAlvo(z.escala);
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
          setEscalaAlvo(atual.current.escala);
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
        <View style={[styles.topo, { paddingTop: insets.top, height: insets.top + 64 }]}>
          <Text style={[fonte(FONTS.displayBlack, 21, 1.2, "#fff"), { flex: 1 }]}>Sua foto</Text>
          <Pressable
            testID="fechar-foto-ampliada"
            onPress={fechar}
            accessibilityRole="button"
            accessibilityLabel="Fechar a foto"
            style={styles.botaoFechar}
          >
            <X size={20} color={COLORS.greenDark} strokeWidth={2.6} />
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
              {!!imagem && (
                <MarcasAmpliadas marcas={marcas} foco={foco} exibida={exibida} imagem={imagem} escalaAlvo={escalaAlvo} escala={escala} />
              )}
            </Animated.View>
          )}
        </View>

        <View style={[styles.painel, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={[fonte(FONTS.bodySemiBold, 15, 1.4, COR.texto2), styles.dica]}>
            Use dois dedos para aproximar, ou toque duas vezes na foto
          </Text>
          <View style={styles.botoes}>
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
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MarcasAmpliadas({
  marcas,
  foco,
  exibida,
  imagem,
  escalaAlvo,
  escala,
}: {
  marcas: MarcaLupa[];
  foco: number | null;
  exibida: Tamanho2D;
  imagem: Tamanho2D;
  escalaAlvo: number;
  escala: Animated.Value;
}) {
  const fator = 1 / Math.max(escalaAlvo, 1);
  const visiveis = marcas
    .map((m, ordem) => ({ m, ordem, r: caixaNaTela(m.area, exibida, imagem, 4, "contain") }))
    .filter((v): v is { m: MarcaLupa; ordem: number; r: Retangulo } => !!v.r);
  const destacada = visiveis.find((v) => v.m.indice === foco);
  return (
    <>
      {!!destacada && <EscurecerFora key={`esc-${destacada.m.indice}`} retangulo={destacada.r} limite={exibida} />}
      {visiveis.map(({ m, ordem, r }) => (
        <AnelMarca
          key={m.indice}
          testID={`marca-ampliada-${m.numero}`}
          numero={m.numero}
          retangulo={r}
          ativa={foco === m.indice}
          ordem={ordem}
          fator={fator}
        />
      ))}
      {visiveis.map(({ m, ordem, r }) => (
        <EtiquetaMarca
          key={`n-${m.indice}`}
          numero={m.numero}
          retangulo={r}
          ativa={foco === m.indice}
          ordem={ordem}
          limite={exibida}
          escalaZoom={escala}
        />
      ))}
    </>
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
  const corTexto = ativo ? "#fff" : COLORS.greenDark;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      style={[styles.botao, ativo && styles.botaoAtivo]}
    >
      <View style={styles.iconeBotao}>
        {numero !== undefined ? (
          <View style={styles.seloNumero}>
            <Text style={{ fontFamily: FONTS.displayBlack, fontSize: 16, lineHeight: 16, color: "#fff" }}>{numero}</Text>
          </View>
        ) : (
          <View style={[styles.moldura, { borderColor: corTexto }]} />
        )}
      </View>
      <Text numberOfLines={2} style={[fonte(FONTS.bodyExtraBold, 17, 1.25, corTexto), { flex: 1 }]}>
        {texto}
      </Text>
      {ativo && <Text style={fonte(FONTS.bodyBold, 15, 1.2, "#bbf7d0")}>Vendo</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: FUNDO },
  topo: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  botaoFechar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingLeft: 16,
    paddingRight: 20,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  area: { flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  painel: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 16,
    gap: 14,
  },
  dica: { textAlign: "center" },
  botoes: { gap: 10 },
  botao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COR.borda,
    backgroundColor: "#fff",
  },
  botaoAtivo: { backgroundColor: COLORS.greenDark, borderColor: COLORS.greenDark },
  iconeBotao: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  seloNumero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#d4381a",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  moldura: { width: 24, height: 18, borderWidth: 2.5, borderRadius: 5 },
});
