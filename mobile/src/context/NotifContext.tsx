import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { listarNotificacoes } from "../api/notificacoes";

interface NotifContextType {
  badgeCount: number;
  recarregarBadge: () => Promise<void>;
}

const NotifContext = createContext<NotifContextType>({
  badgeCount: 0,
  recarregarBadge: async () => {},
});

export function NotifProvider({ children }: { children: React.ReactNode }) {
  const [badgeCount, setBadgeCount] = useState(0);
  const carregando = useRef(false);

  const recarregarBadge = useCallback(async () => {
    if (carregando.current) return;
    carregando.current = true;
    try {
      const lista = await listarNotificacoes(50, 0);
      setBadgeCount(lista.filter(n => n.read_at === null).length);
    } catch {
      // silencioso — badge fica como estava
    } finally {
      carregando.current = false;
    }
  }, []);

  useEffect(() => {
    recarregarBadge();
  }, []);

  // Valor memoizado: os consumidores so re-renderizam quando o badge muda de fato.
  const value = useMemo(() => ({ badgeCount, recarregarBadge }), [badgeCount, recarregarBadge]);

  return (
    <NotifContext.Provider value={value}>
      {children}
    </NotifContext.Provider>
  );
}

export function useNotif() {
  return useContext(NotifContext);
}
