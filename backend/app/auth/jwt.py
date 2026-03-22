import os
import httpx
from jose import jwt, JWSError, ExpiredSignatureError
from fastapi import HTTPException, status

_jwks_cache: dict | None = None


def _get_keycloak_config():
    url = os.getenv("KEYCLOAK_URL", "http://localhost:8180")
    realm = os.getenv("KEYCLOAK_REALM", "stockseer")
    return url, realm


async def _fetch_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    url, realm = _get_keycloak_config()
    jwks_url = f"{url}/realms/{realm}/protocol/openid-connect/certs"
    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url, timeout=10)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        return _jwks_cache


def clear_jwks_cache():
    global _jwks_cache
    _jwks_cache = None


async def decode_token(token: str) -> dict:
    url, realm = _get_keycloak_config()
    issuer = f"{url}/realms/{realm}"

    try:
        jwks = await _fetch_jwks()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot reach identity provider",
        )

    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False},
        )
        return payload
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except JWSError:
        # JWKS may have rotated — clear cache and retry once
        clear_jwks_cache()
        try:
            jwks = await _fetch_jwks()
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["RS256"],
                issuer=issuer,
                options={"verify_aud": False},
            )
            return payload
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
