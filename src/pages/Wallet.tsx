import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletHeader } from '@/components/wallet/WalletHeader';
import { AssetsTab } from '@/components/wallet/AssetsTab';
import { ReceiveTab } from '@/components/wallet/ReceiveTab';
import { SendTab } from '@/components/wallet/SendTab';
import { HistoryTab } from '@/components/wallet/HistoryTab';

const Wallet = () => {
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-4xl py-4 sm:py-8 px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Ví Web3 của bạn
        </h1>
        
        <div className="space-y-6">
          <WalletHeader />
          
          <Tabs defaultValue="assets" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6">
              <TabsTrigger value="assets">Tài sản</TabsTrigger>
              <TabsTrigger value="receive">Nhận</TabsTrigger>
              <TabsTrigger value="send">Gửi</TabsTrigger>
              <TabsTrigger value="history">Lịch sử</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assets">
              <AssetsTab />
            </TabsContent>
            
            <TabsContent value="receive">
              <ReceiveTab />
            </TabsContent>
            
            <TabsContent value="send">
              <SendTab />
            </TabsContent>
            
            <TabsContent value="history">
              <HistoryTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Wallet;
