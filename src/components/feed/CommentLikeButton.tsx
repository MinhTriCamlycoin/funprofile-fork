import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface CommentLikeButtonProps {
  commentId: string;
  onLikeChange?: () => void;
}

interface CommentLike {
  id: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export const CommentLikeButton = ({ commentId, onLikeChange }: CommentLikeButtonProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likes, setLikes] = useState<CommentLike[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLikes();
    
    // Set up realtime subscription for comment likes
    const channel = supabase
      .channel(`comment-likes-${commentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `comment_id=eq.${commentId}`,
        },
        () => {
          fetchLikes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commentId]);

  const fetchLikes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('reactions')
      .select(`
        id,
        user_id,
        profiles (username, avatar_url)
      `)
      .eq('comment_id', commentId)
      .eq('type', 'like');

    if (!error && data) {
      setLikes(data as CommentLike[]);
      setLikeCount(data.length);
      setLiked(user ? data.some(like => like.user_id === user.id) : false);
    }
  };

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }

    setLoading(true);

    if (liked) {
      // Unlike
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (!error) {
        setLiked(false);
        setLikeCount(prev => prev - 1);
        onLikeChange?.();
      }
    } else {
      // Like
      const { error } = await supabase
        .from('reactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          type: 'like',
        });

      if (!error) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
        onLikeChange?.();
      }
    }

    setLoading(false);
  };

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={loading}
          className={`text-xs gap-1.5 transition-all duration-300 ${
            liked 
              ? 'text-red-500 hover:text-red-600' 
              : 'text-muted-foreground hover:text-red-500'
          }`}
        >
          <Heart 
            className={`w-3.5 h-3.5 transition-all duration-300 ${
              liked ? 'fill-red-500 scale-110' : 'scale-100'
            }`} 
          />
          {likeCount > 0 && (
            <span className="animate-fade-in font-medium">{likeCount}</span>
          )}
        </Button>
      </HoverCardTrigger>
      {likes.length > 0 && (
        <HoverCardContent className="w-64 p-3">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Liked by</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {likes.map((like) => (
                <div key={like.id} className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {like.profiles?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{like.profiles?.username || 'Anonymous'}</span>
                </div>
              ))}
            </div>
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
};
