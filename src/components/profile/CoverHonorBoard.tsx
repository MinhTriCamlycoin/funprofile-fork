import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, MessageCircle, Star, Share2, BadgeDollarSign, Coins, Gift, Wallet } from 'lucide-react';

interface UserStats {
  posts_count: number;
  comments_count: number;
  reactions_count: number;
  shares_count: number;
  claimable: number;
  claimed: number;
  total_reward: number;
  total_money: number;
}

interface CoverHonorBoardProps {
  userId: string;
  username: string;
  avatarUrl?: string;
}

export const CoverHonorBoard = ({ userId, username, avatarUrl }: CoverHonorBoardProps) => {
  const [stats, setStats] = useState<UserStats>({
    posts_count: 0,
    comments_count: 0,
    reactions_count: 0,
    shares_count: 0,
    claimable: 0,
    claimed: 0,
    total_reward: 0,
    total_money: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      // Use the optimized database function get_user_rewards
      const { data: rewardData } = await supabase
        .rpc('get_user_rewards', { limit_count: 1000 })
        .eq('id', userId)
        .maybeSingle();

      // Fetch claimed amount separately
      const { data: claimsData } = await supabase
        .from('reward_claims')
        .select('amount')
        .eq('user_id', userId);

      // Fetch total received (transactions to this user's wallet)
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'success');

      const claimedAmount = claimsData?.reduce((sum, claim) => sum + Number(claim.amount), 0) || 0;
      const receivedAmount = transactionsData?.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) || 0;

      if (rewardData) {
        const totalReward = Number(rewardData.total_reward) || 0;
        setStats({
          posts_count: Number(rewardData.posts_count) || 0,
          comments_count: Number(rewardData.comments_count) || 0,
          reactions_count: Number(rewardData.reactions_count) || 0,
          shares_count: Number(rewardData.shares_count) || 0,
          claimable: Math.max(0, totalReward - claimedAmount),
          claimed: claimedAmount,
          total_reward: totalReward,
          total_money: totalReward + receivedAmount,
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="absolute right-2 sm:right-3 top-2 sm:top-3 bottom-2 sm:bottom-3 w-[50%] max-w-[500px]">
        <Skeleton className="h-full w-full rounded-2xl" />
      </div>
    );
  }

  const StatRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
    <div className="flex items-center justify-between py-1 px-2 rounded-lg border border-yellow-500/40 bg-green-800/90 backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <div className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
          {icon}
        </div>
        <span className="text-yellow-400 font-bold text-[10px] sm:text-xs uppercase tracking-wide drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
          {label}
        </span>
      </div>
      <span className="text-white font-bold text-xs sm:text-sm drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">
        {formatNumber(value)}
      </span>
    </div>
  );

  return (
    <div className="absolute right-2 sm:right-3 top-2 sm:top-3 bottom-2 sm:bottom-3 w-[50%] max-w-[500px] min-w-[300px]">
      {/* Main Container - Transparent with gold border */}
      <div className="h-full rounded-2xl overflow-hidden border-2 border-yellow-400 bg-transparent backdrop-blur-sm">
        <div className="relative h-full flex flex-col p-2 sm:p-3">
          {/* Header */}
          <div className="text-center space-y-0.5 mb-2">
            {/* Logo */}
            <div className="flex justify-center">
              <img 
                src="/fun-profile-logo-40.webp" 
                alt="Fun Profile Web3"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.6)]"
              />
            </div>
            
            {/* Title - HONOR BOARD */}
            <h1 
              className="text-lg sm:text-xl font-black tracking-wider uppercase"
              style={{
                fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #fcd34d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(250,204,21,0.8), 0 0 60px rgba(250,204,21,0.4)',
                filter: 'drop-shadow(0 0 10px rgba(250,204,21,0.6))',
              }}
            >
              HONOR BOARD
            </h1>
            
            {/* User info */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-white text-xs font-semibold truncate max-w-[100px] drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">
                {username?.toUpperCase() || 'USER'}
              </span>
              <Avatar className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-yellow-400/70 shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-black font-bold text-xs">
                  {username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 flex-1">
            {/* Left Column - Posts, Reactions, Comments */}
            <div className="space-y-1 sm:space-y-1.5">
              <StatRow 
                icon={<ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                label="Posts"
                value={stats.posts_count}
              />
              <StatRow 
                icon={<Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                label="Reactions"
                value={stats.reactions_count}
              />
              <StatRow 
                icon={<MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                label="Comments"
                value={stats.comments_count}
              />
            </div>

            {/* Right Column - Shares, Claimable, Claimed */}
            <div className="space-y-1 sm:space-y-1.5">
              <StatRow 
                icon={<Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                label="Shares"
                value={stats.shares_count}
              />
              <StatRow 
                icon={<Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                label="Claimable"
                value={stats.claimable}
              />
              <StatRow 
                icon={<Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                label="Claimed"
                value={stats.claimed}
              />
            </div>
          </div>

          {/* Full Width Total Rows */}
          <div className="mt-1.5 sm:mt-2 space-y-1 sm:space-y-1.5">
            <StatRow 
              icon={<BadgeDollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              label="Total Reward"
              value={stats.total_reward}
            />
            <StatRow 
              icon={<Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              label="Total Money"
              value={stats.total_money}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
