import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';

export function AnalyticsTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const sessionLogged = useRef(false);

  useEffect(() => {
    if (!user) return; // Only track authenticated users

    const track = async () => {
      try {
        // Track unique session/entrance
        if (!sessionLogged.current) {
          sessionLogged.current = true;
          await addDoc(collection(db, 'analytics_acessos'), {
            userId: user.id || user.email || 'unknown',
            email: user.email || 'unknown',
            data: serverTimestamp(),
            tipo: 'entrada'
          });
        }

        // Track path views
        let pathName = location.pathname;
        if (pathName === '/') pathName = 'dashboard';
        else pathName = pathName.replace(/\//g, '');
        
        await addDoc(collection(db, 'analytics_abas'), {
          userId: user.id || user.email || 'unknown',
          email: user.email || 'unknown',
          nomeDaAba: pathName,
          data: serverTimestamp()
        });

      } catch (err) {
        // Silently fail for analytics if permissions lack or something
        console.error("Analytics tracking failed", err);
      }
    };

    track();
  }, [location.pathname, user]);

  return null;
}

