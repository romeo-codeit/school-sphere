import { useEffect, useState } from 'react';
import { WifiOff, ArrowUpCircle } from 'lucide-react';
import { getQueueLength, onNetworkChange, processQueueOnce, processAppwriteQueueOnce, isOnline } from '@/lib/offline';

export function OfflineBanner() {
  const [online, setOnline] = useState(isOnline());
  const [queued, setQueued] = useState<number>(getQueueLength());

  useEffect(() => {
    const off = onNetworkChange((o) => setOnline(o));
    const i = setInterval(() => setQueued(getQueueLength()), 2000);
    return () => { off(); clearInterval(i); };
  }, []);

  if (online && queued === 0) return null;

  return (
    <div className="w-full sticky top-0 z-50">
      {!online && (
        <div className="w-full bg-amber-500 text-amber-950 text-sm px-4 py-2 flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          You are offline. Some actions are unavailable. Changes will sync when you're back online.
        </div>
      )}
      {online && queued > 0 && (
          <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 flex items-center justify-center gap-2"
          onClick={() => { processQueueOnce(); processAppwriteQueueOnce(); }}
        >
          <ArrowUpCircle className="w-4 h-4" /> {queued} change(s) pending sync. Tap to sync now.
        </button>
      )}
    </div>
  );
}
