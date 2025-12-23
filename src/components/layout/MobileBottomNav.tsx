import { useState, memo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Menu, Users, Award, Star } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { FacebookLeftSidebar } from '@/components/feed/FacebookLeftSidebar';
import { FacebookRightSidebar } from '@/components/feed/FacebookRightSidebar';
import { useLanguage } from '@/i18n/LanguageContext';

export const MobileBottomNav = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [leftSheetOpen, setLeftSheetOpen] = useState(false);
  const [honorBoardOpen, setHonorBoardOpen] = useState(false);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const navItems = [
    { icon: Home, label: t('feed'), path: '/', action: () => handleNavigate('/') },
    { icon: Users, label: t('friends'), path: '/friends', action: () => handleNavigate('/friends') },
    { icon: Award, label: t('honorBoard'), isCenter: true, action: () => setHonorBoardOpen(true) },
    { icon: Star, label: t('leaderboard'), path: '/leaderboard', action: () => handleNavigate('/leaderboard') },
    { icon: Menu, label: t('menu'), action: () => setLeftSheetOpen(true) },
  ];

  return (
    <>
      {/* Bottom Navigation Bar - Fixed with larger touch targets */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/98 backdrop-blur-lg border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around h-[72px] px-1 max-w-lg mx-auto">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[52px] rounded-2xl transition-all duration-200 touch-manipulation ${
                item.isCenter
                  ? 'relative -mt-8'
                  : item.path && isActive(item.path)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground active:text-primary active:bg-primary/5'
              }`}
            >
              {item.isCenter ? (
                /* Honor Board Center Button - Special Design */
                <div className="relative">
                  {/* Glow ring effect */}
                  <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/40 to-yellow-500/40 blur-md animate-pulse" />
                  {/* Main button */}
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 shadow-lg shadow-amber-500/50 flex items-center justify-center border-4 border-background active:scale-95 transition-transform">
                    <item.icon className="w-7 h-7 text-white drop-shadow-md" strokeWidth={2.5} />
                  </div>
                  {/* Sparkle decorations */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-75" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-amber-200 rounded-full animate-pulse" />
                </div>
              ) : (
                <>
                  <item.icon className="w-6 h-6 transition-transform" strokeWidth={1.8} />
                  <span className="text-[10px] mt-1 font-medium truncate max-w-[52px]">{item.label}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Left Sidebar Sheet (Menu) */}
      <Sheet open={leftSheetOpen} onOpenChange={setLeftSheetOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 bg-background overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-8">
            <FacebookLeftSidebar onItemClick={() => setLeftSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Honor Board Bottom Drawer - Glassmorphism Style */}
      <Drawer open={honorBoardOpen} onOpenChange={setHonorBoardOpen}>
        <DrawerContent className="max-h-[85vh] bg-background/80 backdrop-blur-xl border-t-2 border-amber-500/30">
          <DrawerHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mt-2">
              <Award className="w-6 h-6 text-amber-500" />
              <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                {t('honorBoard')}
              </DrawerTitle>
              <Award className="w-6 h-6 text-amber-500" />
            </div>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto max-h-[70vh]">
            <FacebookRightSidebar />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';
