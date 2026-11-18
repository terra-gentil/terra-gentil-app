import React, { useEffect, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Bell, Play } from "lucide-react-native";
import { CANAL_INSCREVER_URL, VIDEOS_RESERVA, VideoCanal, buscarUltimoVideo } from "../../../api/videosCanal";
import { COLORS, FONTS } from "../../../constants/theme";
import { T, cartao, fonte } from "./comum";

const VERMELHO_YT = "#d7261e"; // contraste AA com branco

interface Props {
  // Pessoa pediu na tela de espera para lembrar do canal
  lembrou?: boolean;
}

// Ultimo bloco do laudo: ultimo video do canal numa moldura (abre no YouTube, nao toca aqui) e botao de inscricao
export default function CartaoCanal({ lembrou = false }: Props) {
  const [video, setVideo] = useState<VideoCanal>(VIDEOS_RESERVA[0]);

  useEffect(() => {
    let vivo = true;
    buscarUltimoVideo().then((v) => vivo && setVideo(v));
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <View testID="cartao-canal" style={[cartao.base, styles.cartao]}>
      <View style={{ gap: 4 }}>
        {lembrou ? (
          <Text testID="cartao-lembrete-canal" style={T.h3}>
            Você pediu para lembrar
          </Text>
        ) : (
          <Text style={T.h3}>Nosso canal no YouTube</Text>
        )}
        <Text style={fonte(FONTS.body, 15, 1.45, COLORS.inkSoft)}>
          Vídeo novo toda semana: jardins abandonados que a gente recupera de graça.
        </Text>
      </View>

      <Pressable
        testID="video-canal"
        onPress={() => Linking.openURL(video.url)}
        accessibilityRole="link"
        accessibilityLabel={`Assistir no YouTube: ${video.titulo}`}
        style={({ pressed }) => [styles.moldura, pressed && { opacity: 0.9 }]}
      >
        <View style={styles.tela}>
          <Image source={{ uri: video.thumb }} style={StyleSheet.absoluteFillObject} resizeMode="cover" accessible={false} />
          <View style={styles.selo}>
            <Text style={fonte(FONTS.bodyExtraBold, 15, 1.1, "#fff")}>Último vídeo</Text>
          </View>
          <View style={styles.play}>
            <Play size={28} color="#fff" fill="#fff" strokeWidth={0} style={{ marginLeft: 4 }} />
          </View>
        </View>
        <Text numberOfLines={2} style={[fonte(FONTS.bodyExtraBold, 15, 1.35, COLORS.ink), styles.titulo]}>
          {video.titulo}
        </Text>
      </Pressable>

      <Pressable
        testID="inscrever-canal"
        onPress={() => Linking.openURL(CANAL_INSCREVER_URL)}
        accessibilityRole="link"
        accessibilityLabel="Inscreva-se no canal Terra Gentil no YouTube"
        style={({ pressed }) => [styles.inscrever, pressed && { opacity: 0.9 }]}
      >
        <Bell size={20} color="#fff" strokeWidth={2.4} />
        <Text style={fonte(FONTS.bodyExtraBold, 17, 1.2, "#fff")}>Inscreva-se no canal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { padding: 16, gap: 14 },
  moldura: {
    borderRadius: 20,
    padding: 6,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: "#e7e0d2",
  },
  tela: {
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: COLORS.greenDark,
    alignItems: "center",
    justifyContent: "center",
  },
  selo: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(20,83,45,0.92)",
  },
  play: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: VERMELHO_YT,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  titulo: { paddingTop: 10, paddingHorizontal: 6, paddingBottom: 4 },
  inscrever: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: VERMELHO_YT,
  },
});
