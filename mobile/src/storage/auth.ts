import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_TOKEN = "@terragentil:auth_jwt";
const KEY_USER = "@terragentil:auth_user";

export interface AuthUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_admin?: boolean;
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_TOKEN);
}

export async function getUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function setAuth(token: string, user: AuthUser): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEY_TOKEN, token),
    AsyncStorage.setItem(KEY_USER, JSON.stringify(user)),
  ]);
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([KEY_TOKEN, KEY_USER]);
}

// Campos extras editaveis pelo usuario (nome pode sobrescrever display_name do Google)
export interface ProfileExtra {
  nome?: string;
  sexo?: string;
  idade?: string;
  email?: string;
}

const KEY_PROFILE_EXTRA = "@terragentil:profile_extra";

export async function getProfileExtra(): Promise<ProfileExtra> {
  const raw = await AsyncStorage.getItem(KEY_PROFILE_EXTRA);
  if (!raw) return {};
  try { return JSON.parse(raw) as ProfileExtra; } catch { return {}; }
}

export async function saveProfileExtra(data: ProfileExtra): Promise<void> {
  await AsyncStorage.setItem(KEY_PROFILE_EXTRA, JSON.stringify(data));
}

export async function updateDisplayName(nome: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY_USER);
  if (!raw) return;
  try {
    const user = JSON.parse(raw) as AuthUser;
    user.display_name = nome;
    await AsyncStorage.setItem(KEY_USER, JSON.stringify(user));
  } catch {}
}
