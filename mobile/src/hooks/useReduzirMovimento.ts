import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// Le o "reduzir movimento" do sistema e acompanha mudancas
export function useReduzirMovimento(): boolean {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (ativo) setReduzir(!!v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => {
      if (ativo) setReduzir(!!v);
    });
    return () => {
      ativo = false;
      sub?.remove?.();
    };
  }, []);
  return reduzir;
}
