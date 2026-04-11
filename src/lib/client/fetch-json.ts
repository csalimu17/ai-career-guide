'use client';

type TokenUser = {
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

async function parseJsonResponse(response: Response) {
  const payloadText = await response.text();
  if (!payloadText) return {};

  try {
    return JSON.parse(payloadText);
  } catch {
    throw new Error('The server returned an unexpected response.');
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function fetchAuthedJson<T>(
  user: TokenUser | null | undefined,
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  if (!user) {
    throw new Error('Authentication required');
  }

  const idToken = await user.getIdToken();
  const headers = new Headers(init?.headers ?? {});
  headers.set('Authorization', `Bearer ${idToken}`);

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetchJson<T>(input, {
    ...init,
    headers,
  });
}
