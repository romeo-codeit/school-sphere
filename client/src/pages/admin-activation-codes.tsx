import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TopNav } from '@/components/top-nav';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { withBase } from '@/lib/http';

export default function AdminActivationCodesPage() {
  const { getJWT } = useAuth();
  const { toast } = useToast();
  const [count, setCount] = useState(10);
  const [prefix, setPrefix] = useState('OHM');
  const [length, setLength] = useState(12);
  const [codeType, setCodeType] = useState<'trial_30d' | 'annual_1y'>('trial_30d');
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<any[]>([]);

  const fetchCodes = async () => {
    try {
      const jwt = await getJWT();
  const res = await fetch(withBase('/api/admin/activation-codes'), { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load codes');
      setCodes(Array.isArray(data.codes) ? data.codes : []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || String(e), variant: 'destructive' });
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const jwt = await getJWT();
      const csrf = (typeof document !== 'undefined') ? (document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const res = await fetch(withBase('/api/admin/activation-codes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
        },
        body: JSON.stringify({ count, prefix, length, codeType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to generate');
      toast({ title: 'Generated', description: `${(data.codes || []).length} codes created.` });
      await fetchCodes();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <TopNav title="Activation Codes" subtitle="Generate and manage codes" showGoBackButton={true} />
      <div className="px-4 sm:px-6 lg:px-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm">Count</label>
                <Input type="number" min={1} max={1000} value={count} onChange={(e) => setCount(parseInt(e.target.value || '0', 10))} />
              </div>
              <div>
                <label className="text-sm">Prefix</label>
                <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Length</label>
                <Input type="number" min={6} max={24} value={length} onChange={(e) => setLength(parseInt(e.target.value || '0', 10))} />
              </div>
                <div>
                  <label className="text-sm">Type</label>
                  <select className="w-full border rounded h-9 px-2 bg-background" value={codeType} onChange={(e) => setCodeType(e.target.value as any)}>
                    <option value="trial_30d">Trial - 30 days</option>
                    <option value="annual_1y">Annual - 1 year</option>
                  </select>
                </div>
            </div>
            <Button onClick={generate} disabled={loading}>{loading ? 'Generating…' : 'Generate'}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((c: any) => (
                    <TableRow key={c.$id}>
                      <TableCell className="font-mono text-xs sm:text-sm">{c.code}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{c.codeType || 'trial_30d'}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{c.durationDays ? `${c.durationDays} days` : '-'}</TableCell>
                      <TableCell className="capitalize">{c.status}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{c.assignedTo || '-'}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{c.createdAt ? new Date(c.createdAt).toLocaleString() : '-'}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{c.usedAt ? new Date(c.usedAt).toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
