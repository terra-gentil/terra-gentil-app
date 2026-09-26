"""Gerado por scripts/contrib/sync-terra-gentil.sh (repo setlists-pj-ev). Não editar aqui."""
import pytest


@pytest.fixture(autouse=True)
def _sem_rate_limit_do_painel():
    from app.contrib.limite import limiter
    anterior, limiter.enabled = limiter.enabled, False
    yield
    limiter.enabled = anterior
