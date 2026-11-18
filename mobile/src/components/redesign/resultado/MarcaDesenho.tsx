import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { FONTS } from "../../../constants/theme";
import { useReduzirMovimento } from "../../../hooks/useReduzirMovimento";
import { Retangulo } from "./derivar";

// Desenho da marca da lupa (Claude Design, handoff em design-handoff-lupa/retorno/HANDOFF-lupa.md).
// Anel em camadas (contorno escuro, branco, coral, fio interno) para aparecer em qualquer foto,
// etiqueta com o numero no ponto de 45 graus da curva e escurecimento fora da area destacada.
// So View/Text/Animated: chega por OTA.

export const MARCA = {
  coral: "#ff5a3c",
  coralEscuro: "#d4381a", // fundo da etiqueta, contraste 4,8:1 com branco
  escurecer: "rgba(12,28,16,0.38)",
};

export const raioMarca = (r: Retangulo) => Math.max(Math.min(r.width, r.height) / 2, 22);

const ATRASO_POR_MARCA = 120;

interface AnelProps {
  testID: string;
  numero: number;
  retangulo: Retangulo;
  ativa: boolean;
  ordem: number;
  // 1 / escala do zoom: mantem a espessura fixa na tela quando a foto esta aproximada
  fator?: number;
}

export function AnelMarca({ testID, numero, retangulo: r, ativa, ordem, fator = 1 }: AnelProps) {
  const reduzir = useReduzirMovimento();
  const entrada = useRef(new Animated.Value(reduzir ? 1 : 0)).current;
  const onda = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzir) {
      entrada.setValue(1);
      return;
    }
    const a = Animated.timing(entrada, {
      toValue: 1,
      duration: 450,
      delay: ATRASO_POR_MARCA * ordem,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [reduzir, ordem, entrada]);

  // Onda que se espalha 2 vezes na marca destacada (substitui o pulso antigo)
  useEffect(() => {
    onda.setValue(0);
    if (!ativa || reduzir) return;
    const a = Animated.sequence([
      Animated.delay(600),
      Animated.loop(
        Animated.timing(onda, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        { iterations: 2 },
      ),
    ]);
    a.start();
    return () => a.stop();
  }, [ativa, reduzir, onda]);

  const R = raioMarca(r);
  const fio = (n: number) => n * fator;
  const anelEntrada = {
    opacity: entrada,
    transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [1.2, 1] }) }],
  };

  return (
    <>
      {ativa && !reduzir && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.abs,
            r,
            {
              borderRadius: R,
              borderWidth: fio(3),
              borderColor: MARCA.coral,
              opacity: onda.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
              transform: [{ scale: onda.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
            },
          ]}
        />
      )}
      <Animated.View
        testID={testID}
        pointerEvents="none"
        accessibilityLabel={`Marca ${numero} na foto`}
        style={[styles.abs, r, anelEntrada]}
      >
        <Animated.View
          style={[
            styles.abs,
            {
              left: -fio(3),
              top: -fio(3),
              width: r.width + fio(6),
              height: r.height + fio(6),
              borderRadius: R + fio(3),
              borderWidth: fio(1),
              borderColor: "rgba(0,0,0,0.35)",
            },
          ]}
        />
        <Animated.View style={[StyleSheet.absoluteFillObject, { borderRadius: R + fio(2), borderWidth: fio(2), borderColor: "#fff" }]} />
        <Animated.View
          testID={`${testID}-anel`}
          style={[StyleSheet.absoluteFillObject, { borderRadius: R, borderWidth: fio(ativa ? 5 : 4), borderColor: MARCA.coral }]}
        />
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              margin: fio(ativa ? 5 : 4),
              borderRadius: Math.max(R - fio(ativa ? 5 : 4), 0),
              borderWidth: fio(1),
              borderColor: "rgba(0,0,0,0.25)",
            },
          ]}
        />
      </Animated.View>
    </>
  );
}

interface EtiquetaProps {
  numero: number;
  retangulo: Retangulo;
  ativa: boolean;
  ordem: number;
  // Limites da foto, para a etiqueta ficar a 4 px das bordas
  limite: { largura: number; altura: number };
  // Escala do zoom (Animated) para a etiqueta manter o tamanho na tela
  escalaZoom?: Animated.Value;
}

export function EtiquetaMarca({ numero, retangulo: r, ativa, ordem, limite, escalaZoom }: EtiquetaProps) {
  const reduzir = useReduzirMovimento();
  const entrada = useRef(new Animated.Value(reduzir ? 1 : 0)).current;

  useEffect(() => {
    if (reduzir) {
      entrada.setValue(1);
      return;
    }
    const a = Animated.timing(entrada, {
      toValue: 1,
      duration: 300,
      delay: ATRASO_POR_MARCA * ordem + 180,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [reduzir, ordem, entrada]);

  const tam = ativa ? 34 : 30;
  const R = raioMarca(r);
  const cx = r.left + R * 0.293;
  const cy = r.top + R * 0.293;
  const left = Math.max(4, Math.min(limite.largura - tam - 4, cx - tam / 2));
  const top = Math.max(4, Math.min(limite.altura - tam - 4, cy - tam / 2));
  const escalaEntrada = entrada.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const escala = escalaZoom ? Animated.multiply(escalaEntrada, Animated.divide(1, escalaZoom)) : escalaEntrada;
  const letra = ativa ? 18 : 16;

  return (
    <Animated.View
      testID={`etiqueta-marca-${numero}`}
      pointerEvents="none"
      style={[
        styles.etiqueta,
        { left, top, width: tam, height: tam, borderRadius: tam / 2, opacity: entrada, transform: [{ scale: escala }] },
      ]}
    >
      <Text style={{ fontFamily: FONTS.displayBlack, fontSize: letra, lineHeight: letra, color: "#fff" }}>{numero}</Text>
    </Animated.View>
  );
}

interface EscurecerProps {
  retangulo: Retangulo;
  // Tamanho da foto: o escurecimento fica so dentro dela
  limite: { largura: number; altura: number };
}

// Escurece a foto fora da marca destacada: 4 faixas em volta da caixa e 4 cantos que arredondam o buraco.
// Tudo do tamanho da foto: a borda gigante sugerida no Design nao desenhava no Android.
export function EscurecerFora({ retangulo: r, limite }: EscurecerProps) {
  const reduzir = useReduzirMovimento();
  const opacidade = useRef(new Animated.Value(reduzir ? 1 : 0)).current;

  useEffect(() => {
    if (reduzir) {
      opacidade.setValue(1);
      return;
    }
    const a = Animated.timing(opacidade, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [reduzir, opacidade]);

  const L = limite.largura;
  const A = limite.altura;
  const esq = Math.max(0, r.left);
  const topo = Math.max(0, r.top);
  const dir = Math.min(L, r.left + r.width);
  const baixo = Math.min(A, r.top + r.height);
  const R = Math.min(raioMarca(r), r.width / 2, r.height / 2);
  const faixa = (left: number, top: number, width: number, height: number) =>
    width > 0 && height > 0 ? { left, top, width, height } : null;
  const faixas = [
    faixa(0, 0, L, topo),
    faixa(0, baixo, L, A - baixo),
    faixa(0, topo, esq, baixo - topo),
    faixa(dir, topo, L - dir, baixo - topo),
  ].filter(Boolean) as Retangulo[];
  // Cantos: quadrado R x R com o lado de fora do arco escuro (borda de um circulo centrado no ponto interno)
  const cantos = [
    { left: r.left, top: r.top, cx: R, cy: R },
    { left: r.left + r.width - R, top: r.top, cx: 0, cy: R },
    { left: r.left, top: r.top + r.height - R, cx: R, cy: 0 },
    { left: r.left + r.width - R, top: r.top + r.height - R, cx: 0, cy: 0 },
  ];

  return (
    <Animated.View testID="escurecer-lupa" pointerEvents="none" style={[styles.abs, { left: 0, top: 0, width: L, height: A, opacity: opacidade }]}>
      {faixas.map((f, i) => (
        <Animated.View key={`f${i}`} style={[styles.abs, f, { backgroundColor: MARCA.escurecer }]} />
      ))}
      {R > 1 &&
        cantos.map((c, i) => (
          <Animated.View key={`c${i}`} style={[styles.abs, { left: c.left, top: c.top, width: R, height: R, overflow: "hidden" }]}>
            <Animated.View
              style={[
                styles.abs,
                {
                  left: c.cx - 2 * R,
                  top: c.cy - 2 * R,
                  width: 4 * R,
                  height: 4 * R,
                  borderRadius: 2 * R,
                  borderWidth: R,
                  borderColor: MARCA.escurecer,
                },
              ]}
            />
          </Animated.View>
        ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
  etiqueta: {
    position: "absolute",
    backgroundColor: MARCA.coralEscuro,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
