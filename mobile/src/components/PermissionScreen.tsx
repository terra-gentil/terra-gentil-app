import React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type PermissionType = "camera" | "gallery";

interface Props {
  type: PermissionType;
  onHome: () => void;
}

const CONTENT: Record<
  PermissionType,
  {
    icon: string;
    title: string;
    description: string;
    permissionItemName: string;
    returnAction: string;
  }
> = {
  camera: {
    icon: "📷",
    title: "Preciso usar sua camera",
    description:
      "Para fotografar suas plantas, o Terra Gentil precisa de acesso a camera do celular.",
    permissionItemName: "Camera",
    returnAction: "tirar a foto",
  },
  gallery: {
    icon: "🖼️",
    title: "Preciso ver suas fotos",
    description:
      "Para usar as fotos que voce ja tem no celular, o Terra Gentil precisa acessar a galeria.",
    permissionItemName: "Fotos e videos",
    returnAction: "escolher uma foto",
  },
};

export function PermissionScreen({ type, onHome }: Props) {
  const content = CONTENT[type];

  async function handleOpenSettings() {
    try {
      await Linking.openSettings();
    } catch {
      // botao Voltar ainda esta disponivel
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{content.icon}</Text>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.description}>{content.description}</Text>

      <Text style={styles.stepsTitle}>Como liberar em 4 passos:</Text>
      <View style={styles.stepsList}>
        <Text style={styles.stepItem}>
          <Text style={styles.stepNumber}>1.  </Text>
          Toque em "Abrir ajustes do celular"
        </Text>
        <Text style={styles.stepItem}>
          <Text style={styles.stepNumber}>2.  </Text>
          Va em "Permissoes"
        </Text>
        <Text style={styles.stepItem}>
          <Text style={styles.stepNumber}>3.  </Text>
          Toque em "{content.permissionItemName}"
        </Text>
        <Text style={styles.stepItem}>
          <Text style={styles.stepNumber}>4.  </Text>
          Selecione "Permitir"
        </Text>
      </View>

      <Text style={styles.hint}>
        Depois e so voltar para o Terra Gentil{"\n"}
        e {content.returnAction}.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleOpenSettings}>
        <Text style={styles.primaryButtonText}>Abrir ajustes do celular</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={onHome}>
        <Text style={styles.secondaryButtonText}>Agora nao, voltar ao inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 28,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1b5e20",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#2e2e2e",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b5e20",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  stepsList: {
    alignSelf: "stretch",
    backgroundColor: "#f5f9f5",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  stepItem: {
    fontSize: 16,
    color: "#2e2e2e",
    lineHeight: 28,
  },
  stepNumber: {
    fontWeight: "700",
    color: "#2e7d32",
  },
  hint: {
    fontSize: 15,
    color: "#5c5c5c",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 24,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
    minHeight: 56,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    minHeight: 48,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#2e7d32",
    fontSize: 16,
    fontWeight: "600",
  },
});
