import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface LawOfLightGuardProps {
  children: React.ReactNode;
}

export const LawOfLightGuard = ({ children }: LawOfLightGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkLawOfLightAcceptance = async () => {
      // Skip check for auth page and law-of-light page itself
      if (location.pathname === '/auth' || location.pathname === '/law-of-light') {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      // If not logged in, allow access (will be handled by other auth guards if needed)
      if (!session) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      // Check if user has accepted the Law of Light
      const { data: profile } = await supabase
        .from('profiles')
        .select('law_of_light_accepted')
        .eq('id', session.user.id)
        .single();

      if (profile && !profile.law_of_light_accepted) {
        // User hasn't accepted, redirect to Law of Light page
        navigate('/law-of-light', { replace: true });
        return;
      }

      setIsAllowed(true);
      setIsChecking(false);
    };

    checkLawOfLightAcceptance();

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check when user signs in
        setTimeout(() => {
          checkLawOfLightAcceptance();
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
};