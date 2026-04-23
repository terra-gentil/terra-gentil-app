import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ConsultaHistorico,
  limparHistorico,
  listarConsultas,
} from "../storage/historico";

const CORES_ESTADO: Record<string, string> = {
  saudavel: "#4caf50",
  atencao: "#ff9800",
  doente: "#f44336",
  critico: "#b71c1c",
  nao_aplicavel: "#9e9e9e",
};

const LABEL_ESTADO: Record<string, string> = {
  saudavel: "Saudavel",
  atencao: "Atencao",
  doente: "Doente",
  critico: "Critico",
  nao_aplicavel: "",
};

function dataRelativa(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const min = 60 * 1000;
  const hora = 60 * min;
  const dia = 24 * hora;

  if (diff < hora) return "Agora";
  if (diff < dia) return "Hoje";
  if (diff < 2 * dia) return "Ontem";
  if (diff < 7 * dia) return `${Math.floor(diff / dia)} dias atras`;

  const d = new Date(timestamp);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export function HistoricoList() {
  const [consultas, setConsultas] = useState<ConsultaHistorico[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const lista = await listarConsultas(5);
    setConsultas(lista);
    setCarregado(true);
  }

  function confirmarLimpar() {
    Alert.alert(
      "Limpar historico",
      "Vou apagar todas as consultas guardadas neste celular. Tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            await limparHistorico();
            setConsultas([]);
          },
        },
      ],
    );
  }

  if (!carregado) return null;
  if (consultas.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>📖 Prontuario do Jardim</Text>
        <TouchableOpacity onPress={confirmarLimpar} hitSlop={10}>
          <Text style={styles.clearBtn}>Limpar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Suas ultimas consultas, guardadas neste celular.
      </Text>

      {consultas.map((c) => (
        <View key={c.id} style={styles.item}>
          <Image source={{ uri: c.imageUri }} style={styles.thumb} />
          <View style={styles.info}>
            <Text style={styles.nome} numberOfLines={1}>
              {c.nome_popular}
            </Text>
            <Text style={styles.especie} numberOfLines={1}>
              {c.especie_identificada}
            </Text>
            <Text style={styles.data}>{dataRelativa(c.timestamp)}</Text>
          </View>
          <View style={styles.estadoWrapper}>
            <View
              style={[
                styles.bolinha,
                {
                  backgroundColor:
                    CORES_ESTADO[c.estado_saude] || "#9e9e9e",
                },
              ]}
            />
            {LABEL_ESTADO[c.estado_saude] ? (
              <Text style={styles.estadoLabel}>
                {LABEL_ESTADO[c.estado_saude]}
              </Text>
            ) : null}
          </View>
        </View>
      ))}

      <Text style={styles.aviso}>
        💾 Historico salvo so neste celular. Se trocar de aparelho, comeca de novo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1b5e20",
  },
  clearBtn: {
    fontSize: 15,
    color: "#c62828",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
    resizeMode: "cover",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nome: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  especie: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
    marginTop: 2,
  },
  data: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  estadoWrapper: {
    alignItems: "center",
    marginLeft: 8,
    minWidth: 60,
  },
  bolinha: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  estadoLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  aviso: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 12,
  },
});
