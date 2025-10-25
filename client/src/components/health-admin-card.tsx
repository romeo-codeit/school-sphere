import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { withBase } from '@/lib/http';

async function fetchHealth(getJWT: () => Promise<string | null>) {
  const jwt = await getJWT();
  const res = await fetch(withBase('/api/admin/health'), {
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
  });
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export function HealthAdminCard() {
  const { getJWT } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => fetchHealth(getJWT)
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-sm">Failed to load health.</p>
        </CardContent>
      </Card>
    );
  }

  const counts = (data?.counts || {}) as Record<string, number>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(counts).map(([name, count]) => (
            <div key={name} className="flex items-center justify-between border rounded p-2">
              <span className="font-medium capitalize">{name.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-muted-foreground">{count === -1 ? 'N/A' : count}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Updated: {new Date(data.timestamp).toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
