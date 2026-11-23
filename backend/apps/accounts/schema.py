from drf_spectacular.extensions import OpenApiAuthenticationExtension


class SessionAuthenticationWith401Scheme(OpenApiAuthenticationExtension):
    target_class = "apps.accounts.authentication.SessionAuthenticationWith401"
    name = "sessionAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "apiKey",
            "in": "cookie",
            "name": "sessionid",
            "description": (
                "Django session cookie, set by `POST /api/auth/login/`. Requests that change data "
                "must also send the `X-CSRFToken` header with the value of the `csrftoken` cookie."
            ),
        }
