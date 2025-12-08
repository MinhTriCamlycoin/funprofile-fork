import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FacebookNavbar } from '@/components/layout/FacebookNavbar';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, History, Settings, Shield, CreditCard } from 'lucide-react';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import WalletCenterContainer from '@/components/wallet/WalletCenterContainer';

const Wallet = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assets');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const menuItems = [
    { icon: WalletIcon, label: 'Tài sản', value: 'assets' },
    { icon: ArrowDownLeft, label: 'Nhận', value: 'receive' },
    { icon: ArrowUpRight, label: 'Gửi', value: 'send' },
    { icon: History, label: 'Lịch sử', value: 'history' },
    { icon: CreditCard, label: 'Mua Crypto', value: 'buy' },
    { icon: Shield, label: 'Bảo mật', value: 'security' },
    { icon: Settings, label: 'Cài đặt', value: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <FacebookNavbar />
      <main className="pt-14">
        <div className="flex">
          {/* Left Sidebar */}
          <div className="w-[360px] h-[calc(100vh-56px)] bg-white shadow-lg fixed left-0 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-gold rounded-xl flex items-center justify-center">
                  <WalletIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Web3 Wallet</h1>
                  <p className="text-sm text-muted-foreground">Quản lý tài sản crypto</p>
                </div>
              </div>

              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setActiveTab(item.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      activeTab === item.value 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      activeTab === item.value ? 'bg-primary text-white' : 'bg-gray-200'
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* MetaMask Connect */}
              <div className="mt-6">
                <WalletConnect />
              </div>
            </div>
          </div>

          {/* Main Content - Center Container */}
          <div className="flex-1 ml-[360px] p-6">
            <div className="max-w-2xl mx-auto">
              <WalletCenterContainer />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Wallet;
