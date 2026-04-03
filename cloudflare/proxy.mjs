function getNormalizedOrigin(value) {
  try {
    const url = new URL(String(value || "").trim());

    if (!/^https?:$/.test(url.protocol)) {
      return null;
    }

    url.pathname = "";
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function buildForwardedHeaders(request) {
  const headers = new Headers(request.headers);
  const requestUrl = new URL(request.url);
  const existingForwardedFor = headers.get("x-forwarded-for");
  const clientIp = request.headers.get("cf-connecting-ip");

  headers.set("x-forwarded-host", requestUrl.host);
  headers.set("x-forwarded-proto", requestUrl.protocol.replace(":", ""));
  headers.set("x-forwarded-url", request.url);

  if (clientIp) {
    headers.set(
      "x-forwarded-for",
      existingForwardedFor ? `${existingForwardedFor}, ${clientIp}` : clientIp
    );
  }

  return headers;
}

function rewriteLocationHeader(response, originUrl, publicUrl) {
  const location = response.headers.get("location");

  if (!location) {
    return response;
  }

  try {
    const resolvedLocation = new URL(location, originUrl);

    if (resolvedLocation.origin !== originUrl.origin) {
      return response;
    }

    resolvedLocation.protocol = publicUrl.protocol;
    resolvedLocation.host = publicUrl.host;

    const headers = new Headers(response.headers);
    headers.set("location", resolvedLocation.toString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch {
    return response;
  }
}

export default {
  async fetch(request, env) {
    const origin = getNormalizedOrigin(env.APP_ORIGIN);

    if (!origin) {
      return new Response(
        "Missing valid APP_ORIGIN for Cloudflare proxy worker.",
        { status: 500 }
      );
    }

    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);
    originUrl.pathname = requestUrl.pathname;
    originUrl.search = requestUrl.search;

    const proxiedRequest = new Request(originUrl.toString(), {
      method: request.method,
      headers: buildForwardedHeaders(request),
      body: request.body,
      redirect: "manual",
      duplex: request.body ? "half" : undefined,
    });

    const response = await fetch(proxiedRequest);

    return rewriteLocationHeader(response, new URL(origin), requestUrl);
  },
};
