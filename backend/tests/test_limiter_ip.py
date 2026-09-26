"""Rate limit por IP real do cliente (atras do load balancer do Railway)."""
from starlette.requests import Request

from app.core.limiter import _client_ip


def _req(headers: dict, host: str = "10.0.0.1") -> Request:
    return Request({
        "type": "http",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
        "client": (host, 1234),
    })


def test_usa_primeiro_ip_do_x_forwarded_for():
    assert _client_ip(_req({"X-Forwarded-For": "200.1.2.3, 10.0.0.1"})) == "200.1.2.3"


def test_clientes_diferentes_nao_dividem_o_limite():
    a = _client_ip(_req({"X-Forwarded-For": "200.1.2.3"}))
    b = _client_ip(_req({"X-Forwarded-For": "189.4.5.6"}))
    assert a != b


def test_sem_proxy_cai_no_ip_do_socket():
    assert _client_ip(_req({})) == "10.0.0.1"
