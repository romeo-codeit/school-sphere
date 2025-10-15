import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TopNav } from '@/components/top-nav';
import { useToast } from '@/hooks/use-toast';

export default function ActivatePage() {
  const { user, role, getJWT } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If not guest, redirect to home
    if (role && role !== 'guest') navigate('/');
  }, [role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const jwt = await getJWT();
      const csrf = (typeof document !== 'undefined') ? (document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const res = await fetch('/api/users/activate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
        },
        body: JSON.stringify({ activationCode: code.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Activation failed');
      toast({ title: 'Activated', description: 'Your subscription is now active.' });
      navigate('/exams');
    } catch (err: any) {
      toast({ title: 'Activation failed', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav title="Activate Subscription" showGoBackButton={true} />
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Enter Activation Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <Input placeholder="Activation Code" value={code} onChange={(e) => setCode(e.target.value)} />
              <Button type="submit" disabled={loading}>{loading ? 'Activating…' : 'Activate'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
