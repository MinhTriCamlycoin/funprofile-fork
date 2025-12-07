import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FacebookNavbar } from '@/components/layout/FacebookNavbar';
import { FriendsList } from '@/components/friends/FriendsList';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Users, UserCheck, Gift, Settings } from 'lucide-react';

const Friends = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setCurrentUserId(session.user.id);
      fetchFriendRequests(session.user.id);
      fetchSuggestions(session.user.id);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setCurrentUserId(session.user.id);
        setLoading(false);
      } else {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchFriendRequests = async (userId: string) => {
    const { data } = await supabase
      .from('friendships')
      .select(`
        *,
        profiles:user_id (id, username, avatar_url, full_name)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');
    
    setFriendRequests(data || []);
  };

  const fetchSuggestions = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .limit(10);
    
    setSuggestions(data || []);
  };

  const menuItems = [
    { icon: Users, label: 'Trang chủ', value: 'all' },
    { icon: UserPlus, label: 'Lời mời kết bạn', value: 'requests', badge: friendRequests.length },
    { icon: UserCheck, label: 'Gợi ý', value: 'suggestions' },
    { icon: Users, label: 'Tất cả bạn bè', value: 'friends' },
    { icon: Gift, label: 'Sinh nhật', value: 'birthdays' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5]">
        <FacebookNavbar />
        <main className="pt-14">
          <div className="flex">
            <div className="w-[360px] h-[calc(100vh-56px)] bg-white shadow p-4">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="flex-1 p-4">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <FacebookNavbar />
      <main className="pt-14">
        <div className="flex">
          {/* Left Sidebar */}
          <div className="w-[360px] h-[calc(100vh-56px)] bg-white shadow-lg fixed left-0 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Bạn bè</h1>
                <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                  <Settings className="w-5 h-5" />
                </button>
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
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-destructive text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 ml-[360px] p-6">
            {activeTab === 'requests' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Lời mời kết bạn</h2>
                {friendRequests.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <UserPlus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-muted-foreground">Không có lời mời kết bạn nào</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {friendRequests.map((request) => (
                      <div key={request.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="aspect-square bg-gray-200">
                          <Avatar className="w-full h-full rounded-none">
                            <AvatarImage src={request.profiles?.avatar_url} className="object-cover" />
                            <AvatarFallback className="rounded-none text-4xl">
                              {request.profiles?.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold">{request.profiles?.full_name || request.profiles?.username}</h3>
                          <p className="text-sm text-muted-foreground mb-3">5 bạn chung</p>
                          <div className="space-y-2">
                            <Button className="w-full bg-primary hover:bg-primary/90">Xác nhận</Button>
                            <Button variant="secondary" className="w-full">Xóa</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'suggestions' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Những người bạn có thể biết</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {suggestions.map((user) => (
                    <div key={user.id} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="aspect-square bg-gray-200">
                        <Avatar className="w-full h-full rounded-none">
                          <AvatarImage src={user.avatar_url} className="object-cover" />
                          <AvatarFallback className="rounded-none text-4xl">
                            {user.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="p-3">
                        <h3 
                          className="font-semibold hover:underline cursor-pointer"
                          onClick={() => navigate(`/profile/${user.id}`)}
                        >
                          {user.full_name || user.username}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">3 bạn chung</p>
                        <div className="space-y-2">
                          <Button className="w-full bg-primary hover:bg-primary/90">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Thêm bạn bè
                          </Button>
                          <Button variant="secondary" className="w-full">Xóa</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'friends' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Tất cả bạn bè</h2>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm" className="pl-10 bg-gray-100 border-0" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <FriendsList userId={currentUserId} />
                </div>
              </div>
            )}

            {activeTab === 'all' && (
              <div>
                {friendRequests.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">Lời mời kết bạn</h2>
                      <button 
                        onClick={() => setActiveTab('requests')}
                        className="text-primary hover:underline"
                      >
                        Xem tất cả
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {friendRequests.slice(0, 4).map((request) => (
                        <div key={request.id} className="bg-white rounded-lg shadow overflow-hidden">
                          <div className="aspect-square bg-gray-200">
                            <Avatar className="w-full h-full rounded-none">
                              <AvatarImage src={request.profiles?.avatar_url} className="object-cover" />
                              <AvatarFallback className="rounded-none text-4xl">
                                {request.profiles?.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="p-3">
                            <h3 className="font-semibold">{request.profiles?.full_name || request.profiles?.username}</h3>
                            <p className="text-sm text-muted-foreground mb-3">5 bạn chung</p>
                            <div className="space-y-2">
                              <Button className="w-full bg-primary hover:bg-primary/90">Xác nhận</Button>
                              <Button variant="secondary" className="w-full">Xóa</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Những người bạn có thể biết</h2>
                    <button 
                      onClick={() => setActiveTab('suggestions')}
                      className="text-primary hover:underline"
                    >
                      Xem tất cả
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {suggestions.slice(0, 8).map((user) => (
                      <div key={user.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="aspect-square bg-gray-200">
                          <Avatar className="w-full h-full rounded-none">
                            <AvatarImage src={user.avatar_url} className="object-cover" />
                            <AvatarFallback className="rounded-none text-4xl">
                              {user.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="p-3">
                          <h3 
                            className="font-semibold hover:underline cursor-pointer"
                            onClick={() => navigate(`/profile/${user.id}`)}
                          >
                            {user.full_name || user.username}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">3 bạn chung</p>
                          <div className="space-y-2">
                            <Button className="w-full bg-primary hover:bg-primary/90">
                              <UserPlus className="w-4 h-4 mr-2" />
                              Thêm bạn bè
                            </Button>
                            <Button variant="secondary" className="w-full">Xóa</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'birthdays' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Sinh nhật</h2>
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-muted-foreground">Không có sinh nhật nào hôm nay</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Friends;
