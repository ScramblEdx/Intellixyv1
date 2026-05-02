import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { doc, setDoc, increment } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';

export function AnalyticsTracker() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return; // Only track authenticated users

    const track = async () => {
      try {
        const dateStr = format(new Date(), 'yyyy-MM-dd');
        
        // Track daily unique or total accesses? Let's do total interactions/pageviews
        // daily views
        const dailyRef = doc(db, 'analytics', `daily_${dateStr}`);
        await setDoc(dailyRef, {
          date: dateStr,
          views: increment(1)
        }, { merge: true });

        // Track path views
        let pathName = location.pathname;
        if (pathName === '/') pathName = 'dashboard';
        else pathName = pathName.replace(/\//g, '');
        
        const pathRef = doc(db, 'analytics', `path_${pathName}`);
        await setDoc(pathRef, {
          path: pathName,
          views: increment(1)
        }, { merge: true });

      } catch (err) {
        // Silently fail for analytics if permissions lack or something
        console.error("Analytics tracking failed", err);
      }
    };

    track();
  }, [location.pathname, user]);

  return null;
}
