from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework.authentication import SessionAuthentication

if TYPE_CHECKING:
    from rest_framework.request import Request


class SessionAuthenticationWith401(SessionAuthentication):
    # Without an authenticate header DRF answers 403 to anonymous requests;
    # the SPA relies on 401 to tell "no session" apart from "not allowed".
    def authenticate_header(self, request: Request) -> str:
        return "Session"
