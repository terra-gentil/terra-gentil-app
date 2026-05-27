"""
Testes unitarios de auth_service: create_jwt e verify_jwt.
Sem dependencia de banco ou HTTP — funcoes puras de JWT.
"""
import pytest
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from jose import jwt as jose_jwt

from app.core.config import settings
from app.services.auth_service import create_jwt, verify_jwt

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


class TestCreateJwt:
    def test_retorna_string_com_tres_partes(self):
        token = create_jwt(TEST_USER_ID)
        assert len(token.split(".")) == 3

    def test_payload_contem_user_id(self):
        token = create_jwt(TEST_USER_ID)
        payload = jose_jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        assert payload["sub"] == TEST_USER_ID

    def test_token_diferente_para_user_ids_distintos(self):
        t1 = create_jwt("aaa")
        t2 = create_jwt("bbb")
        assert t1 != t2


class TestVerifyJwt:
    def test_token_valido_retorna_user_id(self):
        token = create_jwt(TEST_USER_ID)
        resultado = verify_jwt(token)
        assert resultado["user_id"] == TEST_USER_ID

    def test_token_lixo_levanta_401(self):
        with pytest.raises(HTTPException) as exc:
            verify_jwt("isso.nao.e.um.jwt")
        assert exc.value.status_code == 401

    def test_token_expirado_levanta_401(self):
        exp = datetime.now(timezone.utc) - timedelta(seconds=1)
        token = jose_jwt.encode(
            {"sub": TEST_USER_ID, "exp": exp},
            settings.JWT_SECRET,
            algorithm="HS256",
        )
        with pytest.raises(HTTPException) as exc:
            verify_jwt(token)
        assert exc.value.status_code == 401

    def test_token_sem_sub_levanta_401(self):
        token = jose_jwt.encode(
            {"data": "sem_campo_sub"},
            settings.JWT_SECRET,
            algorithm="HS256",
        )
        with pytest.raises(HTTPException) as exc:
            verify_jwt(token)
        assert exc.value.status_code == 401

    def test_token_assinado_com_secret_errado_levanta_401(self):
        token = jose_jwt.encode(
            {"sub": TEST_USER_ID},
            "segredo-errado",
            algorithm="HS256",
        )
        with pytest.raises(HTTPException) as exc:
            verify_jwt(token)
        assert exc.value.status_code == 401
