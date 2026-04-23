import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";

import {
  DiagnosticoResponse,
  diagnosticarPlanta,
} from "./src/api/diagnostico";
import { ErrorScreen } from "./src/components/ErrorScreen";
import { AppError } from "./src/errors/AppError";
import { toAppError, logError } from "./src/errors/errorHandler";

const NIVEL_LUZ_LABEL: Record<string, string> = {
  sol_pleno: "Sol pleno",
  meia_sombra: "Meia sombra",
  indireta_brilhante: "Luz indireta brilhante",
  sombra: "Sombra",
};

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<DiagnosticoResponse | null>(null);
  const [appError, setAppError] = useState<AppError | null>(null);

  async function handleTirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissao negada",
        "Precisamos da camera pra fotografar a planta.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    setResultado(null);
    await enviarParaDiagnostico(uri);
  }

  async function handleEscolherGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissao negada",
        "Precisamos acessar a galeria pra escolher a imagem.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    setResultado(null);
    await enviarParaDiagnostico(uri);
  }

  async function enviarParaDiagnostico(uri: string) {
    setLoading(true);
    try {
      const data = await diagnosticarPlanta(uri);
      setResultado(data);
    } catch (err) {
      const appErr = toAppError(err);
      logError(appErr, "diagnostico");
      setAppError(appErr);
      setImageUri(null);
    } finally {
      setLoading(false);
    }
  }

  function handleNovaFoto() {
    setImageUri(null);
    setResultado(null);
    setAppError(null);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🌱</Text>
          <Text style={styles.title}>Terra Gentil</Text>
          <Text style={styles.subtitle}>Doutor das Plantas</Text>
        </View>

        {!imageUri && !resultado && !appError && (
          <View style={styles.initial}>
            <Text style={styles.intro}>
              Tire uma foto da sua planta para receber um diagnostico completo.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleTirarFoto}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>Tirar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleEscolherGaleria}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>
                Escolher da galeria
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {imageUri && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </View>
        )}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={styles.loadingText}>
              Analisando sua planta...
            </Text>
          </View>
        )}

        {appError && !loading && (
          <ErrorScreen
            error={appError}
            onRetry={handleNovaFoto}
            onHome={handleNovaFoto}
          />
        )}

        {resultado && !loading && !resultado.eh_planta && (
          <View style={styles.resultBox}>
            <Text style={styles.naoPlantaTitle}>Hmm...</Text>
            <Text style={styles.naoPlantaMessage}>
              {resultado.plano_tratamento}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNovaFoto}
            >
              <Text style={styles.primaryButtonText}>Tentar outra foto</Text>
            </TouchableOpacity>
          </View>
        )}

        {resultado && !loading && resultado.eh_planta && (
          <View style={styles.resultBox}>
            <Text style={styles.resultSpecies}>
              {resultado.especie_identificada}
            </Text>
            <Text style={styles.resultPopular}>{resultado.nome_popular}</Text>
            <Text style={styles.resultConfidence}>
              Confianca: {Math.round(resultado.confianca * 100)}%
            </Text>

            {resultado.toxica_para_pets && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ATENCAO: toxica para pets e criancas pequenas.
                </Text>
              </View>
            )}

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Luz</Text>
                <Text style={styles.infoValue}>
                  {NIVEL_LUZ_LABEL[resultado.nivel_luz] || resultado.nivel_luz}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Regar a cada</Text>
                <Text style={styles.infoValue}>
                  {resultado.rega_dias} dias
                </Text>
              </View>
            </View>

            {resultado.problemas_detectados.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Problemas detectados</Text>
                {resultado.problemas_detectados.map((problema, idx) => (
                  <View key={idx} style={styles.problemaItem}>
                    <Text style={styles.problemaDesc}>
                      {problema.descricao}
                    </Text>
                    <Text style={styles.problemaCausa}>
                      Gravidade {problema.gravidade}. {problema.causa_provavel}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plano de tratamento</Text>
              <Text style={styles.planoText}>{resultado.plano_tratamento}</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNovaFoto}
            >
              <Text style={styles.primaryButtonText}>Nova foto</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f9f5",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1b5e20",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#558b2f",
    marginTop: 4,
  },
  initial: {
    marginTop: 24,
    alignItems: "center",
  },
  intro: {
    fontSize: 16,
    color: "#424242",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#2e7d32",
  },
  secondaryButtonText: {
    color: "#2e7d32",
    fontSize: 16,
    fontWeight: "600",
  },
  imageWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    resizeMode: "cover",
  },
  loadingBox: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#555",
  },
  resultBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  resultSpecies: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1b5e20",
    fontStyle: "italic",
  },
  resultPopular: {
    fontSize: 18,
    color: "#2e7d32",
    marginTop: 4,
  },
  resultConfidence: {
    fontSize: 14,
    color: "#777",
    marginTop: 8,
  },
  warningBox: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#c62828",
    padding: 12,
    marginTop: 16,
    borderRadius: 6,
  },
  warningText: {
    color: "#c62828",
    fontWeight: "600",
    fontSize: 14,
  },
  infoGrid: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#558b2f",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 15,
    color: "#1b5e20",
    marginTop: 4,
    fontWeight: "600",
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b5e20",
    marginBottom: 8,
  },
  problemaItem: {
    backgroundColor: "#fff8e1",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  problemaDesc: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
  },
  problemaCausa: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  planoText: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 22,
  },
  naoPlantaTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b5e20",
    textAlign: "center",
    marginBottom: 12,
  },
  naoPlantaMessage: {
    fontSize: 15,
    color: "#424242",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
});
