import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthForm } from '@/components/auth/AuthForm';

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Space Video Background */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/space-background.mp4" type="video/mp4" />
      </video>
      
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo with Halo Effect */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/40 via-yellow-500/30 to-emerald-500/40 blur-3xl animate-pulse" />
          </div>
          <img 
            src="/fun-profile-logo.jpg" 
            alt="FUN Profile WEB3" 
            className="w-32 h-32 mx-auto rounded-full relative z-10 drop-shadow-[0_0_30px_rgba(16,185,129,0.8)]"
          />
        </div>
        <AuthForm />
      </div>
    </div>
  );
};

export default Auth;
