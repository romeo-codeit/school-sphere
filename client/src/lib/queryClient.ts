import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { account } from "./appwrite";

// Allow configuring an external API host in production (e.g., when the static
// site is on Vercel and the API is hosted elsewhere). Defaults to same-origin.
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || "";

function withBase(url: string): string {
  // If url is absolute (http/https) or already includes the base, return as-is
  if (/^https?:\/\//i.test(url)) return url;
  if (API_BASE && url.startsWith("/")) return `${API_BASE}${url}`;
  return url;
}

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
  // Helper: refresh server-side cookies via our backend, avoiding client-side JWT minting
  const refreshJwtCookie = async () => {
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
  let res = await fetch(withBase(url), {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Attempt automatic refresh of cookie if 401: first try minting a fresh JWT via Appwrite session
  if (res.status === 401) {
    try {
      await refreshJwtCookie();
      res = await fetch(withBase(url), {
        method,
        headers: {
          ...(data ? { "Content-Type": "application/json" } : {}),
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
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
    const url = String(queryKey.join("/"));
    let res = await fetch(withBase(url), {
      credentials: "include",
      headers: csrf ? { 'X-CSRF-Token': csrf } : {},
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (res.status === 401) {
      try {
        await fetch(withBase('/api/auth/refresh'), { method: 'POST', credentials: 'include' });
        res = await fetch(withBase(url), {
          credentials: 'include',
          headers: csrf ? { 'X-CSRF-Token': csrf } : {},
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
