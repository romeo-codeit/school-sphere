import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { account } from "./appwrite";

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
  // Helper: ensure we have a fresh HttpOnly JWT cookie by minting a new Appwrite JWT
  const refreshJwtCookie = async () => {
    try {
      const { jwt } = await account.createJWT();
      try { localStorage.setItem('appwrite_jwt', jwt); } catch {}
      await fetch('/api/auth/jwt-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jwt }),
        credentials: 'include',
      });
    } catch {}
  };
  const csrf = (typeof document !== 'undefined')
    ? (document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1] || '')
    : '';
  let res = await fetch(url, {
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
      res = await fetch(url, {
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
    let res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: csrf ? { 'X-CSRF-Token': csrf } : {},
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (res.status === 401) {
      try {
        // Mint a fresh JWT from the active Appwrite session and set HttpOnly cookie
        const { jwt } = await account.createJWT();
        try { localStorage.setItem('appwrite_jwt', jwt); } catch {}
        await fetch('/api/auth/jwt-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jwt }),
          credentials: 'include',
        });
        res = await fetch(queryKey.join("/") as string, {
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
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3, // Retry failed requests up to 3 times
    },
    mutations: {
      // Mutations are not retried by default, which is the desired behavior.
    },
  },
});
