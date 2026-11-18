"""Fase 2: compara o diagnostico do Claude (v2) com o do Gemini (v1) em fotos reais.

Uso (na pasta backend, com ANTHROPIC_API_KEY e GEMINI_API_KEY no backend/.env):
    .venv/bin/python scripts/fase2_comparar.py /caminho/da/pasta/de/fotos
    opcoes: --so-claude, --so-gemini, --lado 1280 (testa outro tamanho de foto)

Saida em backend/fase2-resultados/<data-hora>/: um JSON por foto e provedor e resumo.md.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# O Claude Code exporta CLAUDE_EFFORT no proprio terminal; sem isso o teste herdaria o esforco dele
if os.environ.get("CLAUDE_CODE_SESSION_ID"):
    os.environ.pop("CLAUDE_EFFORT", None)

from app.core.config import settings  # noqa: E402
from app.services import claude_service  # noqa: E402
from app.services.claude_service import ClaudeService, ClaudeServiceError  # noqa: E402
from app.services.gemini_service import GeminiService  # noqa: E402

# Precos do Opus 5.5 em US$ por milhao de tokens (docs/PROPOSTA-DIAGNOSTICO-V2.md, secao de custo)
# Gravacao no cache: US$ 5 com validade de 5 minutos, US$ 8 com 1 hora (pagina de precos, 18/11/2026)
PRECO_ENTRADA, PRECO_SAIDA, PRECO_CACHE_LEITURA = 4.0, 20.0, 0.20
PRECO_CACHE_GRAVACAO = {"5m": 5.0, "1h": 8.0}
EXTENSOES = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


class ClienteMedido:
    """Envolve o cliente real para guardar o usage da ultima resposta."""

    def __init__(self, real):
        self._real = real
        self.ultima = None
        self.messages = self

    async def create(self, **params):
        self.ultima = await self._real.messages.create(**params)
        return self.ultima


def custo_claude(uso) -> float:
    return (
        (uso.input_tokens or 0) * PRECO_ENTRADA
        + (uso.output_tokens or 0) * PRECO_SAIDA
        + (getattr(uso, "cache_read_input_tokens", 0) or 0) * PRECO_CACHE_LEITURA
        + (getattr(uso, "cache_creation_input_tokens", 0) or 0) * PRECO_CACHE_GRAVACAO[settings.CLAUDE_CACHE_TTL]
    ) / 1_000_000


def resumo_claude(r) -> dict:
    return {
        "especie": r.especie_identificada,
        "nome": r.nome_popular,
        "confianca": r.identificacao.nivel_confianca,
        "saude": r.estado_saude.value,
        "problemas": [f"{p.descricao} ({p.gravidade})" for p in r.problemas_detectados],
        "ebooks": [e.model_dump().get("id") for e in r.ebooks_recomendados],
    }


def resumo_gemini(r) -> dict:
    return {
        "especie": r.especie_identificada,
        "nome": r.nome_popular,
        "confianca": r.confianca,
        "saude": r.estado_saude.value,
        "problemas": [f"{p.descricao} ({p.gravidade})" for p in r.problemas_detectados],
    }


async def rodar_claude(servico: ClaudeService, medido: ClienteMedido, foto: bytes) -> dict:
    inicio = time.monotonic()
    try:
        r = await servico.diagnosticar(foto)
    except ClaudeServiceError as exc:
        return {"erro": f"{exc.motivo}: {exc}", "tempo_s": round(time.monotonic() - inicio, 1)}
    uso = medido.ultima.usage
    return {
        "tempo_s": round(time.monotonic() - inicio, 1),
        "entrada": uso.input_tokens,
        "saida": uso.output_tokens,
        "cache_leitura": getattr(uso, "cache_read_input_tokens", 0),
        "cache_gravacao": getattr(uso, "cache_creation_input_tokens", 0),
        "custo_usd": round(custo_claude(uso), 4),
        "resumo": resumo_claude(r),
        "relatorio": r.model_dump(mode="json"),
    }


async def rodar_gemini(servico: GeminiService, foto: bytes) -> dict:
    inicio = time.monotonic()
    try:
        r = await asyncio.to_thread(servico.diagnosticar, foto, 1)
    except Exception as exc:
        return {"erro": f"{type(exc).__name__}: {exc}", "tempo_s": round(time.monotonic() - inicio, 1)}
    return {
        "tempo_s": round(time.monotonic() - inicio, 1),
        "resumo": resumo_gemini(r),
        "relatorio": r.model_dump(mode="json"),
    }


def linha_tabela(nome: str, c: dict | None, g: dict | None) -> str:
    def cel_c():
        if not c:
            return "-", "-", "-", "-"
        if "erro" in c:
            return f"ERRO {c['erro'][:40]}", f"{c['tempo_s']}", "-", "-"
        s = c["resumo"]
        return (f"{s['nome']} ({s['confianca']})", f"{c['tempo_s']}",
                f"{c['entrada']}/{c['saida']}/{c['cache_leitura']}/{c['cache_gravacao']}", f"{c['custo_usd']:.4f}")

    def cel_g():
        if not g:
            return "-", "-"
        if "erro" in g:
            return f"ERRO {g['erro'][:40]}", f"{g['tempo_s']}"
        s = g["resumo"]
        return f"{s['nome']} ({s['confianca']:.2f})", f"{g['tempo_s']}"

    return "| " + " | ".join([nome, *cel_c(), *cel_g()]) + " |"


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pasta")
    ap.add_argument("--so-claude", action="store_true")
    ap.add_argument("--so-gemini", action="store_true")
    ap.add_argument("--lado", type=int, help="lado maior da foto enviada ao Claude (padrao do servico)")
    args = ap.parse_args()

    fotos = sorted(p for p in Path(args.pasta).iterdir() if p.suffix.lower() in EXTENSOES)
    if not fotos:
        sys.exit(f"Nenhuma foto em {args.pasta}")

    if args.lado:
        claude_service.LADO_MAXIMO_PX = args.lado

    medido = claude = gemini = None
    if not args.so_gemini:
        medido = ClienteMedido(claude_service._obter_cliente())
        claude = ClaudeService(client=medido)
    if not args.so_claude:
        gemini = GeminiService()

    saida = Path(__file__).resolve().parents[1] / "fase2-resultados" / datetime.now().strftime("%Y%m%d-%H%M")
    saida.mkdir(parents=True, exist_ok=True)
    print(f"{len(fotos)} fotos, modelo Claude {settings.CLAUDE_MODEL} esforco {settings.CLAUDE_EFFORT}, "
          f"Gemini {settings.GEMINI_MODEL}. Saida: {saida}")

    linhas = []
    total_custo = 0.0
    tempos_c, tempos_g = [], []
    for foto in fotos:
        dados = foto.read_bytes()
        # Sequencial de proposito: a primeira chamada grava o cache, as outras leem
        c = await rodar_claude(claude, medido, dados) if claude else None
        g = await rodar_gemini(gemini, dados) if gemini else None
        for prov, res in (("claude", c), ("gemini", g)):
            if res:
                (saida / f"{foto.stem}.{prov}.json").write_text(json.dumps(res, ensure_ascii=False, indent=2))
        if c and "erro" not in c:
            total_custo += c["custo_usd"]
            tempos_c.append(c["tempo_s"])
        if g and "erro" not in g:
            tempos_g.append(g["tempo_s"])
        linhas.append(linha_tabela(foto.name, c, g))
        print(linhas[-1], flush=True)

    def media(v):
        return f"{sum(v) / len(v):.1f}" if v else "-"

    resumo = [
        f"# Fase 2, comparacao em {datetime.now():%d/%m/%Y %H:%M}",
        "",
        f"Claude {settings.CLAUDE_MODEL} (esforco {settings.CLAUDE_EFFORT}), Gemini {settings.GEMINI_MODEL}, {len(fotos)} fotos.",
        f"Tempo medio: Claude {media(tempos_c)} s, Gemini {media(tempos_g)} s. "
        f"Pior Claude: {max(tempos_c) if tempos_c else '-'} s.",
        f"Custo Claude: total US$ {total_custo:.4f}, medio US$ {total_custo / max(len(tempos_c), 1):.4f} por diagnostico.",
        "",
        "| Foto | Claude: planta (confianca) | Claude s | tokens ent/sai/cache lido/cache gravado | US$ | Gemini: planta (confianca) | Gemini s |",
        "|---|---|---|---|---|---|---|",
        *linhas,
    ]
    (saida / "resumo.md").write_text("\n".join(resumo) + "\n")
    print("\n".join(resumo[:5]))


if __name__ == "__main__":
    asyncio.run(main())
