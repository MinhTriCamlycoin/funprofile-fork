import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Search, Bell, Wallet, User, LogOut, LogIn, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { NotificationDropdown } from './NotificationDropdown';
import { SearchDialog } from './SearchDialog';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      <nav className="max-w-7xl w-full bg-white rounded-full shadow-lg px-6 py-3 flex items-center justify-between">
        {/* Left: Navigation Links */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className={`rounded-full font-medium transition-all ${
              isActive('/') 
                ? 'bg-primary/10 text-gray-900' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Home className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Home</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/friends')}
            className={`rounded-full font-medium transition-all ${
              isActive('/friends') 
                ? 'bg-primary/10 text-gray-900' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Friends</span>
          </Button>
          <SearchDialog />
        </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-2">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-glow" />
            <img
              src="/fun-profile-logo.jpg"
              alt="FUN"
              className="relative w-16 h-16 rounded-full border-4 border-white shadow-xl cursor-pointer hover:scale-110 transition-transform"
              onClick={() => navigate('/')}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/wallet')}
            className="rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Wallet className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <User className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          {isLoggedIn ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogin}
              className="rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogIn className="w-5 h-5" />
            </Button>
          )}
        </div>
      </nav>
    </div>
  );
};
