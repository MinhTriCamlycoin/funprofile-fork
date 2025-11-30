import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .refine(
      val => !['admin', 'administrator', 'system', 'root', 'moderator', 'mod', 'support', 'help'].includes(val.toLowerCase()),
      { message: 'This username is reserved' }
    )
    .optional(),
});

export const AuthForm = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = authSchema.safeParse({
        email,
        password,
        username: isLogin ? undefined : username,
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success('Account created! Please check your email.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success('Password reset email sent! Please check your inbox.');
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md relative overflow-visible border-0 shadow-none bg-transparent">
      {/* Sci-Fi Shield Frame with Gold Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 via-yellow-600 to-amber-600 rounded-lg" 
           style={{
             clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
             padding: '6px'
           }}>
        {/* Inner white pearl background with circuit pattern */}
        <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-lg relative overflow-hidden"
             style={{
               clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
             }}>
          {/* Circuit board pattern overlay */}
          <div className="absolute inset-0 opacity-5" 
               style={{
                 backgroundImage: `
                   linear-gradient(90deg, #10b981 1px, transparent 1px),
                   linear-gradient(0deg, #10b981 1px, transparent 1px)
                 `,
                 backgroundSize: '20px 20px'
               }} />
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              {isLogin ? 'Welcome Back' : 'Join FUN Profile'}
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 font-semibold">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required={!isLogin}
                      className="border-2 border-slate-400 bg-white/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/50 shadow-inner transition-all"
                      style={{
                        boxShadow: 'inset 0 2px 8px rgba(16, 185, 129, 0.1)'
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-2 border-slate-400 bg-white/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/50 shadow-inner transition-all"
                    style={{
                      boxShadow: 'inset 0 2px 8px rgba(16, 185, 129, 0.1)'
                    }}
                  />
                  {/* Energy glow effect */}
                  <div className="absolute inset-0 rounded-md pointer-events-none opacity-0 hover:opacity-100 transition-opacity"
                       style={{
                         boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                       }} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 border-2 border-slate-400 bg-white/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/50 shadow-inner transition-all"
                    style={{
                      boxShadow: 'inset 0 2px 8px rgba(16, 185, 129, 0.1)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-600 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {/* Energy glow effect */}
                  <div className="absolute inset-0 rounded-md pointer-events-none opacity-0 hover:opacity-100 transition-opacity"
                       style={{
                         boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                       }} />
                </div>
              </div>
              
              {/* Power Switch Button */}
              <Button 
                type="submit" 
                className="w-full relative overflow-hidden border-0 h-12 text-base font-bold text-white shadow-lg hover:shadow-2xl transition-all duration-300 group" 
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
                }}
              >
                {/* Glowing effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
                  {!loading && (
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="3" className="animate-pulse" />
                    </svg>
                  )}
                </span>
              </Button>
            </form>
            <div className="mt-5 space-y-3">
              {isLogin && (
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              {showForgotPassword && (
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-2 border-slate-400 bg-white/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/50"
                  />
                  <Button 
                    onClick={handleForgotPassword} 
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                    disabled={loading}
                  >
                    Send Reset Email
                  </Button>
                </div>
              )}
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setShowForgotPassword(false);
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500 font-semibold">OR</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-slate-300 bg-white/60 hover:bg-slate-50 hover:border-emerald-400 text-slate-700 font-semibold transition-all"
                onClick={() => navigate('/')}
              >
                Use without account
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};
