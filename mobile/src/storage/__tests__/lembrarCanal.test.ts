import AsyncStorage from "@react-native-async-storage/async-storage";
import { consumirLembrarCanal, marcarLembrarCanal } from "../preferencias";

describe("lembrete do canal", () => {
  beforeEach(() => AsyncStorage.clear());

  it("sem lembrete devolve false", async () => {
    expect(await consumirLembrarCanal()).toBe(false);
  });

  it("aparece uma vez so depois de marcado", async () => {
    await marcarLembrarCanal();
    expect(await consumirLembrarCanal()).toBe(true);
    expect(await consumirLembrarCanal()).toBe(false);
  });
});
