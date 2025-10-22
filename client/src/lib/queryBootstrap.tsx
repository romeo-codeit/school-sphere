import React from 'react';
import { queryClient } from './queryClient';
import { getExam, getMeta } from './idbCache';

// Bootstraps critical React Query caches from IndexedDB BEFORE the app renders,
// so we avoid a cold fetch on hard refresh and show cached data instantly.
export function QueryBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        // Only hydrate when our IDB schema matches
        const listSchema = await getMeta('exams_version');
        // Hydrate the School Exams list used on the Exams page (no questions)
        if (listSchema === 1) {
          const cacheKey = 'cbt:exams:all:default:none:wq0';
          const cached = await getExam(cacheKey);
          if (cached) {
            // Matches useQuery key in useExams({ limit: 'all', withQuestions: false })
            queryClient.setQueryData(['cbt-exams', undefined, 'all', undefined, false], cached);
          }
        }
      } catch {}
      if (mounted) setReady(true);
    };
    hydrate();
    return () => { mounted = false; };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
