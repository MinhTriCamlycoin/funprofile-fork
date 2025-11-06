import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { SendCrypto } from '@/components/wallet/SendCrypto';
import { SolanaWallet } from '@/components/wallet/SolanaWallet';
import { SendSolana } from '@/components/wallet/SendSolana';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenManager } from '@/components/wallet/TokenManager';
import { SolanaTokenManager } from '@/components/wallet/SolanaTokenManager';

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
      <main className="container max-w-2xl py-8">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Your Web3 Wallet
        </h1>
        <Tabs defaultValue="evm" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="evm">Ethereum & BSC</TabsTrigger>
            <TabsTrigger value="solana">Solana</TabsTrigger>
          </TabsList>
          <TabsContent value="evm" className="space-y-6">
            <WalletConnect />
            <SendCrypto />
            <TokenManager />
          </TabsContent>
          <TabsContent value="solana" className="space-y-6">
            <SolanaWallet />
            <SendSolana />
            <SolanaTokenManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Wallet;
