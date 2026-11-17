"""
Trava diaria de diagnosticos no Claude.

Contador em memoria por dia no horario de Brasilia (UTC-3). Cada chamada ao Claude
reserva uma vaga antes de sair, inclusive as que falham, porque uma chamada que
estoura o tempo ainda pode ser cobrada.

Limitacao conhecida: o contador vive no processo. Ele zera quando o servidor reinicia
(deploy, queda) e nao e compartilhado entre processos. Hoje o backend roda um unico
processo uvicorn no Railway, entao no pior caso um dia com deploy pode passar do limite
ate o dobro. A trava externa continua sendo o limite de gasto do workspace no Console
da Anthropic.
"""
import threading
from datetime import datetime, timedelta, timezone

FUSO_BRASILIA = timezone(timedelta(hours=-3))


def hoje_brasilia() -> str:
    return datetime.now(FUSO_BRASILIA).date().isoformat()


class TravaDiaria:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._dia = ""
        self._total = 0

    def _virar_dia(self) -> None:
        dia = hoje_brasilia()
        if dia != self._dia:
            self._dia = dia
            self._total = 0

    def reservar(self, limite: int) -> bool:
        """Reserva uma vaga do dia. Devolve False se o limite ja foi atingido."""
        with self._lock:
            self._virar_dia()
            if self._total >= limite:
                return False
            self._total += 1
            return True

    def usados_hoje(self) -> int:
        with self._lock:
            self._virar_dia()
            return self._total

    def zerar(self) -> None:
        """Usado nos testes."""
        with self._lock:
            self._dia = ""
            self._total = 0


trava_claude = TravaDiaria()
