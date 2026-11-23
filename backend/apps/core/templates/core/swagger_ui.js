"use strict";

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
};

// Django rotates the CSRF token when a user signs in, so it is read from the
// cookie on every request instead of being embedded once when the page renders.
const requestInterceptor = (request) => {
  const token = readCookie("csrftoken");
  if (token && !["GET", undefined].includes(request.method) && request.credentials === "same-origin") {
    request.headers["{{ csrf_header_name }}"] = token;
  }
  return request;
};

SwaggerUIBundle({
  url: "{{ schema_url|escapejs }}",
  dom_id: "#swagger-ui",
  presets: [SwaggerUIBundle.presets.apis],
  layout: "BaseLayout",
  requestInterceptor,
  ...{{ settings|safe }},
});

// A page cannot set the session cookie, so the "Authorize" box would do nothing;
// signing in is done with the login endpoint, as the description explains.
const style = document.createElement("style");
style.textContent = ".swagger-ui .scheme-container { display: none; }";
document.head.appendChild(style);
