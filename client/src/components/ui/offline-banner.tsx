import { useEffect, useState } from 'react';
import { WifiOff, ArrowUpCircle, X } from 'lucide-react';
import { getQueueLength, onNetworkChange, processQueueOnce, processAppwriteQueueOnce, checkOnline } from '@/lib/offline';

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState<number>(getQueueLength());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const o = await checkOnline();
      setOnline(o);
    };
    check();
    const off = onNetworkChange(async (o) => {
      if (o) {
        const realOnline = await checkOnline();
        setOnline(realOnline);
      } else {
        setOnline(false);
      }
    });
    const i = setInterval(() => {
      check();
      setQueued(getQueueLength());
    }, 10000); // Check every 10 seconds
    return () => { off(); clearInterval(i); };
  }, []);

  if ((online && queued === 0) || dismissed) return null;

  return (
    <div className="w-full sticky top-0 z-50">
      {!online && (
        <div className="w-full bg-amber-500 text-amber-950 text-sm px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            You are offline. Some actions are unavailable. Changes will sync when you're back online.
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="ml-2 p-1 hover:bg-amber-600 rounded"
            aria-label="Dismiss offline banner"
          >
            <X className="w-4 h-4" />
          </button>
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
