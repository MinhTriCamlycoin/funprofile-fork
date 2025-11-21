import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageCircle, Send } from 'lucide-react';
import { z } from 'zod';
import { CommentItem } from './CommentItem';
import { CommentMediaUpload } from './CommentMediaUpload';

const commentSchema = z.object({
  content: z.string().max(1000, 'Comment must be less than 1000 characters'),
});

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url?: string | null;
  video_url?: string | null;
  parent_comment_id?: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
}

export const CommentSection = ({ postId, onCommentAdded }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments) {
      fetchComments();
      
      // Set up realtime subscription for new comments
      const channel = supabase
        .channel(`comments-${postId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `post_id=eq.${postId}`,
          },
          () => {
            fetchComments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [postId, showComments]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (username, avatar_url)
      `)
      .eq('post_id', postId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load comments');
      return;
    }

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from('comments')
          .select(`
            *,
            profiles (username, avatar_url)
          `)
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });

        return {
          ...comment,
          replies: replies || [],
        };
      })
    );

    setComments(commentsWithReplies);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !mediaUrl) return;

    const validation = commentSchema.safeParse({ content: newComment.trim() });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please sign in to comment');
      setLoading(false);
      return;
    }

    const insertData: any = {
      post_id: postId,
      user_id: user.id,
      content: newComment.trim() || '',
    };

    if (mediaUrl) {
      if (mediaType === 'image') {
        insertData.image_url = mediaUrl;
      } else if (mediaType === 'video') {
        insertData.video_url = mediaUrl;
      }
    }

    const { error } = await supabase
      .from('comments')
      .insert(insertData);

    if (error) {
      toast.error('Failed to post comment');
    } else {
      setNewComment('');
      setMediaUrl(null);
      setMediaType(null);
      fetchComments();
      onCommentAdded?.();
      toast.success('Comment posted!');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </Button>

      {showComments && (
        <div className="space-y-4 pl-4 border-l-2 border-border">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReplyAdded={fetchComments}
              onCommentDeleted={fetchComments}
            />
          ))}

          <form onSubmit={handleSubmit} className="space-y-2 animate-fade-in">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[80px]"
              disabled={loading}
            />
            
            <div className="flex items-center justify-between">
              <CommentMediaUpload
                onMediaUploaded={(url, type) => {
                  setMediaUrl(url);
                  setMediaType(type);
                }}
                onMediaRemoved={() => {
                  setMediaUrl(null);
                  setMediaType(null);
                }}
              />
              
              <Button 
                type="submit" 
                size="sm" 
                disabled={loading || (!newComment.trim() && !mediaUrl)}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Post
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
