const FIREBASE_AUTH_HELPER_ORIGIN = "https://studio-3704831244-a5638.firebaseapp.com";

async function proxyFirebaseAuthHelper(
  request: Request,
  params: { path?: string[] }
) {
  const pathSegments = params.path || [];
  const upstreamUrl = new URL(
    `/__/auth/${pathSegments.join("/")}`,
    FIREBASE_AUTH_HELPER_ORIGIN
  );
  upstreamUrl.search = new URL(request.url).search;

  const headers = new Headers();
  for (const headerName of [
    "accept",
    "content-type",
    "origin",
    "referer",
    "user-agent",
    "x-client-version",
    "x-firebase-gmpid",
  ]) {
    const headerValue = request.headers.get(headerName);
    if (headerValue) {
      headers.set(headerName, headerValue);
    }
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  for (const headerName of [
    "content-encoding",
    "content-length",
    "connection",
    "transfer-encoding",
  ]) {
    responseHeaders.delete(headerName);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxyFirebaseAuthHelper(request, await context.params);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxyFirebaseAuthHelper(request, await context.params);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxyFirebaseAuthHelper(request, await context.params);
}

export async function OPTIONS(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxyFirebaseAuthHelper(request, await context.params);
}
