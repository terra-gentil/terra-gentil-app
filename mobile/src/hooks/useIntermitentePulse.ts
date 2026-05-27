import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export function useIntermitentePulse(delayInicial = 3500, intervalo = 5000): Animated.Value {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    function pulsar() {
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.22, duration: 200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        timeout = setTimeout(pulsar, intervalo);
      });
    }
    timeout = setTimeout(pulsar, delayInicial);
    return () => clearTimeout(timeout);
  }, []);
  return anim;
}
