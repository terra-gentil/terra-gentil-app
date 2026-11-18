import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Canal unico dos lembretes locais (retorno e rega)
export const CANAL_PLANTAS = "lembretes-plantas";

export type EstadoPermissao = "liberada" | "pode_perguntar" | "bloqueada";

export async function estadoPermissao(): Promise<EstadoPermissao> {
  const p = await Notifications.getPermissionsAsync();
  if (p.status === "granted") return "liberada";
  // canAskAgain ausente (mocks, iOS antigo): trata como "pode perguntar"
  return p.canAskAgain === false ? "bloqueada" : "pode_perguntar";
}

// Pedido do sistema (Android 13+: POST_NOTIFICATIONS)
export async function pedirAoSistema(): Promise<EstadoPermissao> {
  const p = await Notifications.requestPermissionsAsync();
  if (p.status === "granted") return "liberada";
  return p.canAskAgain === false ? "bloqueada" : "pode_perguntar";
}

// Canal Android precisa existir antes de agendar
export async function garantirCanal(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CANAL_PLANTAS, {
    name: "Lembretes das plantas",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export function ddmm(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function hora(d: Date): string {
  return d.getMinutes() === 0 ? `${d.getHours()}h` : `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`;
}

export function textoPronto(d: Date): string {
  return `Pronto! Vou te avisar no dia ${ddmm(d)}, às ${hora(d)}.`;
}
