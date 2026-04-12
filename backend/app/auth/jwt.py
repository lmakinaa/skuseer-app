import os
import httpx
from jose import jwt, JWSError, ExpiredSignatureError
from fastapi import HTTPException, status

_jwks_cache: dict | None = None


def _get_keycloak_config():
    """
    Returns (internal_url, issuer_url, realm).

    - internal_url: used for backend->keycloak HTTP calls (JWKS fetch).
      In Docker, this is the service DNS name (http://keycloak:8080).
    - issuer_url:  used for validating the `iss` claim. MUST match what the
      browser used when obtaining the token (http://localhost:8180 in dev),
      otherwise issuer validation fails.

    Falls back to KEYCLOAK_URL for both if KEYCLOAK_ISSUER_URL is unset,
    preserving behavior for non-docker runs.
    """
    internal = os.getenv("KEYCLOAK_URL", "http://localhost:8180")
    issuer = os.getenv("KEYCLOAK_ISSUER_URL", internal)
    realm = os.getenv("KEYCLOAK_REALM", "stockseer")
    return internal, issuer, realm


async def _fetch_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    internal, _issuer, realm = _get_keycloak_config()
    jwks_url = f"{internal}/realms/{realm}/protocol/openid-connect/certs"
    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url, timeout=10)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        return _jwks_cache


def clear_jwks_cache():
    global _jwks_cache
    _jwks_cache = None


async def decode_token(token: str) -> dict:
    _internal, issuer_url, realm = _get_keycloak_config()
    issuer = f"{issuer_url}/realms/{realm}"

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
