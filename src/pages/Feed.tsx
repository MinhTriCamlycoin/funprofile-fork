import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostCard } from '@/components/feed/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { HonorBoard } from '@/components/feed/HonorBoard';
import { LeftSidebar } from '@/components/feed/LeftSidebar';

const Feed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }
      fetchPosts();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setCurrentUserId(session.user.id);
      } else {
        setCurrentUserId('');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
      setPosts(data || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Video Background */}
      <div className="fixed inset-0 -z-10">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/space-background.mp4" type="video/mp4" />
        </video>
      </div>

      <Navbar />
      
      <main className="fixed top-28 left-0 right-0 bottom-0 overflow-hidden">
        <div className="container mx-auto px-4 h-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Left Sidebar - Hidden on mobile */}
            <aside className="hidden lg:block lg:col-span-3 scroll-container pb-6">
              <LeftSidebar />
            </aside>

            {/* Main Feed */}
            <div className="lg:col-span-6 scroll-container pb-6">
              <div className="space-y-6">
                {currentUserId && <CreatePost onPostCreated={fetchPosts} />}
                
                {!currentUserId && (
                  <div className="p-4 bg-white rounded-2xl text-center border-2 border-gold">
                    <p className="text-sm text-primary font-medium">
                      Đăng nhập để tạo bài viết và tương tác
                    </p>
                  </div>
                )}
                
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-48 w-full bg-white/5" />
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border-2 border-gold">
                    <p className="text-primary font-medium">Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={currentUserId}
                      onPostDeleted={fetchPosts}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right Sidebar - Hidden on mobile */}
            <aside className="hidden lg:block lg:col-span-3 scroll-container pb-6">
              <HonorBoard />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feed;
