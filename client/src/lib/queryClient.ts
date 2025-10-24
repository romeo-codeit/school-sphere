import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { account } from "./appwrite";
import { withBase } from "@/lib/http";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Read JWT once per request; prefer localStorage value to avoid Appwrite calls in native
  const getAuthToken = (): string | null => {
    try {
      return (
        localStorage.getItem('appwrite_jwt') ||
        localStorage.getItem('appwrite_session') ||
        null
      );
    } catch {
      return null;
    }
  };
  // Helper: prefer server-side refresh endpoint (works with session cookie set via jwt-cookie)
  const refreshAuthCookies = async () => {
    try {
      await fetch(withBase('/api/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
  };
  const csrf = (typeof document !== 'undefined')
    ? (document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1] || '')
    : '';
  const jwt = getAuthToken();
  let res = await fetch(withBase(url), {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Attempt automatic refresh via backend refresh endpoint
  if (res.status === 401) {
    try {
      await refreshAuthCookies();
      res = await fetch(withBase(url), {
        method,
        headers: {
          ...(data ? { "Content-Type": "application/json" } : {}),
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
          ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });
    } catch {}
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const csrf = (typeof document !== 'undefined')
      ? (document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1] || '')
      : '';
    const jwt = (() => { try { return localStorage.getItem('appwrite_jwt'); } catch { return null; } })();
    const url = String(queryKey.join("/"));
    let res = await fetch(withBase(url), {
      credentials: "include",
      headers: {
        ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (res.status === 401) {
      try {
        // Mint a fresh JWT from the active Appwrite session and set HttpOnly cookie
        const { jwt } = await account.createJWT();
        try { localStorage.setItem('appwrite_jwt', jwt); } catch {}
        await fetch(withBase('/api/auth/jwt-cookie'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jwt }),
          credentials: 'include',
        });
        res = await fetch(withBase(url), {
          credentials: 'include',
          headers: {
            ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          },
        });
      } catch {}
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 3,
    },
    mutations: {
      // Mutations are not retried by default, which is the desired behavior.
    },
  },
});
