import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export function useIntermitentePulse(delayInicial = 3500, intervalo = 5000): Animated.Value {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let vivo = true;
    let timeout: ReturnType<typeof setTimeout>;
    function pulsar() {
      if (!vivo) return;
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.22, duration: 200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        // Sem esse guarda o callback reagendava o pulso depois do unmount, pra sempre.
        if (vivo) timeout = setTimeout(pulsar, intervalo);
      });
    }
    timeout = setTimeout(pulsar, delayInicial);
    return () => {
      vivo = false;
      clearTimeout(timeout);
      anim.stopAnimation();
    };
  }, []);
  return anim;
}
