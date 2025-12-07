import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FacebookNavbar } from '@/components/layout/FacebookNavbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, TrendingUp, Users, MessageCircle, Heart, Share2 } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url: string | null;
  full_name: string | null;
  posts_count: number;
  comments_count: number;
  reactions_count: number;
  friends_count: number;
  total_reward: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('reward');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name');

      if (error) throw error;

      const usersWithRewards = await Promise.all(
        profiles.map(async (profile) => {
          const { data: posts } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', profile.id);

          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          const { count: reactionsCount } = await supabase
            .from('reactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          const { count: friendsCount } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`)
            .eq('status', 'accepted');

          const { count: sharedCount } = await supabase
            .from('shared_posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          let total_reward = 50000;
          const posts_count = posts?.length || 0;
          total_reward += posts_count * 10000;
          total_reward += (commentsCount || 0) * 5000;
          total_reward += (friendsCount || 0) * 50000;
          total_reward += (sharedCount || 0) * 20000;

          if (posts && posts.length > 0) {
            for (const post of posts) {
              const { count: postReactionsCount } = await supabase
                .from('reactions')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

              const reactionsOnPost = postReactionsCount || 0;
              if (reactionsOnPost >= 3) {
                total_reward += 30000 + (reactionsOnPost - 3) * 1000;
              }
            }
          }

          return {
            id: profile.id,
            username: profile.username,
            avatar_url: profile.avatar_url,
            full_name: profile.full_name,
            posts_count,
            comments_count: commentsCount || 0,
            reactions_count: reactionsCount || 0,
            friends_count: friendsCount || 0,
            total_reward
          };
        })
      );

      const sortedUsers = usersWithRewards.sort((a, b) => b.total_reward - a.total_reward);
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-200';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-200';
    return 'bg-gray-100 text-gray-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5" />;
    if (rank === 2) return <Medal className="w-5 h-5" />;
    if (rank === 3) return <Award className="w-5 h-5" />;
    return null;
  };

  const categories = [
    { value: 'reward', label: 'Tổng thưởng', icon: Trophy },
    { value: 'posts', label: 'Bài viết', icon: TrendingUp },
    { value: 'friends', label: 'Bạn bè', icon: Users },
    { value: 'comments', label: 'Bình luận', icon: MessageCircle },
    { value: 'reactions', label: 'Lượt thích', icon: Heart },
  ];

  const sortedByCategory = [...users].sort((a, b) => {
    switch (activeCategory) {
      case 'posts': return b.posts_count - a.posts_count;
      case 'friends': return b.friends_count - a.friends_count;
      case 'comments': return b.comments_count - a.comments_count;
      case 'reactions': return b.reactions_count - a.reactions_count;
      default: return b.total_reward - a.total_reward;
    }
  });

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <FacebookNavbar />
      <main className="pt-14">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-gold rounded-2xl p-8 mb-6 text-white text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Bảng Xếp Hạng</h1>
            <p className="text-white/80">Những thành viên xuất sắc nhất FUN Profile</p>
          </div>

          {/* Category Tabs */}
          <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.value 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Top 3 Podium */}
          {!loading && sortedByCategory.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* 2nd Place */}
              <div className="bg-white rounded-xl shadow-sm p-6 text-center order-1 mt-8">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">
                  2
                </div>
                <Avatar 
                  className="w-20 h-20 mx-auto mb-3 ring-4 ring-gray-300 cursor-pointer"
                  onClick={() => handleUserClick(sortedByCategory[1].id)}
                >
                  <AvatarImage src={sortedByCategory[1].avatar_url || ''} />
                  <AvatarFallback>{sortedByCategory[1].username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{sortedByCategory[1].full_name || sortedByCategory[1].username}</h3>
                <p className="text-primary font-bold text-lg">
                  {activeCategory === 'reward' 
                    ? `${sortedByCategory[1].total_reward.toLocaleString('vi-VN')} 🪙`
                    : sortedByCategory[1][`${activeCategory}_count` as keyof LeaderboardUser]?.toLocaleString('vi-VN')
                  }
                </p>
              </div>

              {/* 1st Place */}
              <div className="bg-white rounded-xl shadow-lg p-6 text-center order-2 ring-2 ring-yellow-400">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white">
                  <Trophy className="w-10 h-10" />
                </div>
                <Avatar 
                  className="w-24 h-24 mx-auto mb-3 ring-4 ring-yellow-400 cursor-pointer"
                  onClick={() => handleUserClick(sortedByCategory[0].id)}
                >
                  <AvatarImage src={sortedByCategory[0].avatar_url || ''} />
                  <AvatarFallback>{sortedByCategory[0].username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg">{sortedByCategory[0].full_name || sortedByCategory[0].username}</h3>
                <p className="text-primary font-bold text-xl">
                  {activeCategory === 'reward' 
                    ? `${sortedByCategory[0].total_reward.toLocaleString('vi-VN')} 🪙`
                    : sortedByCategory[0][`${activeCategory}_count` as keyof LeaderboardUser]?.toLocaleString('vi-VN')
                  }
                </p>
              </div>

              {/* 3rd Place */}
              <div className="bg-white rounded-xl shadow-sm p-6 text-center order-3 mt-12">
                <div className="w-14 h-14 bg-gradient-to-r from-amber-500 to-amber-700 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-xl font-bold">
                  3
                </div>
                <Avatar 
                  className="w-16 h-16 mx-auto mb-3 ring-4 ring-amber-500 cursor-pointer"
                  onClick={() => handleUserClick(sortedByCategory[2].id)}
                >
                  <AvatarImage src={sortedByCategory[2].avatar_url || ''} />
                  <AvatarFallback>{sortedByCategory[2].username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-sm">{sortedByCategory[2].full_name || sortedByCategory[2].username}</h3>
                <p className="text-primary font-bold">
                  {activeCategory === 'reward' 
                    ? `${sortedByCategory[2].total_reward.toLocaleString('vi-VN')} 🪙`
                    : sortedByCategory[2][`${activeCategory}_count` as keyof LeaderboardUser]?.toLocaleString('vi-VN')
                  }
                </p>
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-bold text-lg">Bảng xếp hạng đầy đủ</h2>
            </div>

            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {sortedByCategory.map((user, index) => {
                  const rank = index + 1;
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user.id)}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankStyle(rank)}`}>
                        {rank <= 3 ? getRankIcon(rank) : rank}
                      </div>
                      
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user.full_name || user.username}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{user.posts_count} bài viết</span>
                          <span>{user.friends_count} bạn bè</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
                          {activeCategory === 'reward' 
                            ? user.total_reward.toLocaleString('vi-VN')
                            : (user[`${activeCategory}_count` as keyof LeaderboardUser] as number)?.toLocaleString('vi-VN')
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activeCategory === 'reward' ? 'Camly Coin' : categories.find(c => c.value === activeCategory)?.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
