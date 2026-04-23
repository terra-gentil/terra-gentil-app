import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MASCOT_GIFT } from "../assets/mascot";

type Estado = "fechado" | "form" | "enviando" | "sucesso" | "erro";

interface Props {
  nomePopular: string;
}

const FORMSUBMIT_URL = "https://formsubmit.co/ajax/contato@terragentil.com.br";

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function EbookCard({ nomePopular }: Props) {
  const [estado, setEstado] = useState<Estado>("fechado");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState(
    `Ola Doutor! Gostaria de receber um guia sobre a ${nomePopular}.`,
  );
  const [erroMsg, setErroMsg] = useState("");

  function abrirForm() {
    setEstado("form");
  }

  async function enviar() {
    if (!nome.trim()) {
      setErroMsg("Por favor, me diga seu nome.");
      return;
    }
    if (!emailValido(email)) {
      setErroMsg("Confira seu email, parece que tem algo errado.");
      return;
    }
    setErroMsg("");
    setEstado("enviando");

    try {
      const response = await fetch(FORMSUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: nome.trim(),
          email: email.trim(),
          message: mensagem.trim(),
          _subject: `Pedido de guia: ${nomePopular}`,
          _template: "table",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setEstado("sucesso");
    } catch (err) {
      console.log("[ebook] erro no envio:", err);
      setEstado("erro");
    }
  }

  function tentarDeNovo() {
    setEstado("form");
  }

  if (estado === "fechado") {
    return (
      <View style={styles.card}>
        <View style={styles.accent} />
        <View style={styles.content}>
          <Image source={MASCOT_GIFT} style={styles.giftImg} />
          <Text style={styles.title}>🎉 Voce ganhou um presente!</Text>
          <Text style={styles.subtitle}>
            Posso te mandar um guia especial sobre a {nomePopular} por email. Totalmente gratis.
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={abrirForm}>
            <Text style={styles.ctaButtonText}>Resgatar meu guia</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (estado === "sucesso") {
    return (
      <View style={styles.card}>
        <View style={styles.accent} />
        <View style={styles.content}>
          <Text style={styles.title}>📩 Pedido anotado!</Text>
          <Text style={styles.subtitle}>
            Fique de olho no seu email. Em ate 24 horas seu guia chega por la.
          </Text>
        </View>
      </View>
    );
  }

  const enviando = estado === "enviando";

  return (
    <View style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.content}>
        <Text style={styles.title}>Receber meu guia da {nomePopular}</Text>

        <Text style={styles.label}>Seu nome</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Como posso te chamar"
          placeholderTextColor="#a38a4a"
          editable={!enviando}
          autoComplete="name"
          textContentType="name"
        />

        <Text style={styles.label}>Seu email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          placeholderTextColor="#a38a4a"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!enviando}
          autoComplete="email"
          textContentType="emailAddress"
        />

        <Text style={styles.label}>Sua mensagem</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={mensagem}
          onChangeText={setMensagem}
          multiline
          numberOfLines={4}
          editable={!enviando}
        />

        {erroMsg !== "" && <Text style={styles.erroInline}>{erroMsg}</Text>}

        {estado === "erro" && (
          <Text style={styles.erroInline}>
            Nao consegui enviar agora. Confira sua conexao e tente de novo.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.ctaButton, enviando && styles.ctaButtonDisabled]}
          onPress={estado === "erro" ? tentarDeNovo : enviar}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaButtonText}>
              {estado === "erro" ? "Tentar de novo" : "Enviar pedido"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff8dc",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0c75c",
    shadowColor: "#8a6d0a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  accent: {
    height: 6,
    backgroundColor: "#e6a817",
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  giftImg: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: "cover",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6b4e0b",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#7a5c16",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 13,
    fontWeight: "700",
    color: "#6b4e0b",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0c878",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
    minHeight: 48,
  },
  textarea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  erroInline: {
    alignSelf: "flex-start",
    color: "#c62828",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  ctaButton: {
    backgroundColor: "#e6a817",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
    width: "100%",
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
