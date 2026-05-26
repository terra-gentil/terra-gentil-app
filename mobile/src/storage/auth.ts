import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_TOKEN = "@terragentil:auth_jwt";
const KEY_USER = "@terragentil:auth_user";

export interface AuthUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
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
