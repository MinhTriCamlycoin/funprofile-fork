import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FacebookNavbar } from '@/components/layout/FacebookNavbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetamaskHeader } from '@/components/wallet/MetamaskHeader';
import { MetamaskAssetsTab } from '@/components/wallet/MetamaskAssetsTab';
import { ReceiveTab } from '@/components/wallet/ReceiveTab';
import { SendTab } from '@/components/wallet/SendTab';
import { HistoryTab } from '@/components/wallet/HistoryTab';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, History, Settings, Shield, CreditCard } from 'lucide-react';

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

              {/* MetaMask Logo */}
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" 
                    alt="MetaMask" 
                    className="w-10 h-10"
                  />
                  <div>
                    <p className="font-semibold text-sm">Kết nối với MetaMask</p>
                    <p className="text-xs text-muted-foreground">Ví Web3 an toàn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 ml-[360px] p-6">
            <div className="max-w-3xl mx-auto">
              {/* Wallet Header Card */}
              <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl shadow-lg p-6 mb-6 text-white">
                <MetamaskHeader 
                  onSendClick={() => setActiveTab('send')}
                />
              </div>

              {/* Content Tabs */}
              <div className="bg-white rounded-xl shadow-sm">
                {activeTab === 'assets' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Tài sản của bạn</h2>
                    <MetamaskAssetsTab />
                  </div>
                )}

                {activeTab === 'receive' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Nhận tiền</h2>
                    <ReceiveTab />
                  </div>
                )}

                {activeTab === 'send' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Gửi tiền</h2>
                    <SendTab />
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Lịch sử giao dịch</h2>
                    <HistoryTab />
                  </div>
                )}

                {activeTab === 'buy' && (
                  <div className="p-6 text-center py-12">
                    <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Mua Crypto</h3>
                    <p className="text-muted-foreground mb-4">Mua crypto bằng thẻ tín dụng hoặc chuyển khoản</p>
                    <a 
                      href="https://www.moonpay.com/buy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
                    >
                      Mua ngay với MoonPay
                    </a>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="p-6 text-center py-12">
                    <Shield className="w-16 h-16 mx-auto text-primary mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Bảo mật ví</h3>
                    <p className="text-muted-foreground">Ví của bạn được bảo vệ bởi MetaMask</p>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="p-6 text-center py-12">
                    <Settings className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Cài đặt</h3>
                    <p className="text-muted-foreground">Tính năng đang phát triển</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <button 
                  onClick={() => setActiveTab('receive')}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ArrowDownLeft className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-medium text-sm">Nhận</p>
                </button>
                <button 
                  onClick={() => setActiveTab('send')}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ArrowUpRight className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="font-medium text-sm">Gửi</p>
                </button>
                <button 
                  onClick={() => window.open('https://pancakeswap.finance/swap', '_blank')}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <p className="font-medium text-sm">Swap</p>
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <History className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="font-medium text-sm">Lịch sử</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Wallet;
