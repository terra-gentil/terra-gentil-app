import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppError } from "../errors/AppError";
import { errorMessages } from "../errors/errorMessages";

interface Props {
  error: AppError;
  onRetry?: () => void;
  onHome?: () => void;
}

export function ErrorScreen({ error, onRetry, onHome }: Props) {
  const info = errorMessages[error.code];

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>!</Text>
      <Text style={styles.title}>{info.title}</Text>
      <Text style={styles.message}>{info.message}</Text>

      {onRetry && (
        <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
          <Text style={styles.primaryButtonText}>{info.actionLabel}</Text>
        </TouchableOpacity>
      )}

      {onHome && (
        <TouchableOpacity style={styles.secondaryButton} onPress={onHome}>
          <Text style={styles.secondaryButtonText}>Voltar ao inicio</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 16,
  },
  icon: {
    fontSize: 48,
    color: "#c62828",
    marginBottom: 16,
    fontWeight: "700",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1b5e20",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#424242",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  secondaryButtonText: {
    color: "#2e7d32",
    fontSize: 15,
    fontWeight: "600",
  },
});
