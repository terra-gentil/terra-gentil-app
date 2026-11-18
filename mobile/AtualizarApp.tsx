// Tela unica do app antigo (1.0.0): obriga a instalar a versao nova pela Play.
import React from "react";
import { Image, Linking, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";

const PACOTE = "br.com.terragentil.app";

async function abrirLoja() {
  try {
    await Linking.openURL(`market://details?id=${PACOTE}`);
  } catch {
    await Linking.openURL(`https://play.google.com/store/apps/details?id=${PACOTE}`);
  }
}

export default function AtualizarApp() {
  return (
    <View style={s.tela}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Image source={require("./assets/logo-atualizar.png")} style={s.logo} resizeMode="contain" />
      <Text style={s.titulo}>Tem uma versão nova do Terra Gentil</Text>
      <Text style={s.texto}>
        Agora o Doutor fala com você, mostra na foto onde está o problema e aceita até 3 fotos da planta.
      </Text>
      <Text style={s.texto}>Para continuar usando, atualize o aplicativo. É gratuito.</Text>
      <Pressable
        onPress={abrirLoja}
        accessibilityRole="button"
        accessibilityLabel="Atualizar o aplicativo na Play Store"
        style={({ pressed }) => [s.botao, pressed && { opacity: 0.85 }]}
      >
        <Text style={s.botaoTexto}>Atualizar agora</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#000000", alignItems: "center", justifyContent: "center", padding: 28 },
  logo: { width: 260, height: 260, marginBottom: 12 },
  titulo: { color: "#FFFFFF", fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 16 },
  texto: { color: "#E8E4DC", fontSize: 20, lineHeight: 29, textAlign: "center", marginBottom: 12 },
  botao: { marginTop: 20, backgroundColor: "#E79C0B", borderRadius: 16, paddingVertical: 20, paddingHorizontal: 36, minWidth: 260, alignItems: "center" },
  botaoTexto: { color: "#000000", fontSize: 22, fontWeight: "800" },
});
