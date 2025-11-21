import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Trash2 } from 'lucide-react';
import { CommentLikeButton } from './CommentLikeButton';
import { CommentReplyForm } from './CommentReplyForm';
import { CommentMediaViewer } from './CommentMediaViewer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onReplyAdded: () => void;
  onCommentDeleted: () => void;
  level?: number;
}

export const CommentItem = ({ 
  comment, 
  postId, 
  onReplyAdded, 
  onCommentDeleted,
  level = 0 
}: CommentItemProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const handleDelete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== comment.user_id) {
      toast.error('You can only delete your own comments');
      return;
    }

    if (!confirm('Delete this comment?')) return;

    setDeleting(true);
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment.id);

    if (error) {
      toast.error('Failed to delete comment');
    } else {
      toast.success('Comment deleted');
      onCommentDeleted();
    }
    setDeleting(false);
  };

  const mediaUrl = comment.image_url || comment.video_url;
  const mediaType = comment.image_url ? 'image' : 'video';

  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-8 pl-4 border-l-2 border-border' : ''}`}>
      <div className="flex gap-3 group animate-fade-in">
        <Avatar className="w-8 h-8 ring-2 ring-primary/10 transition-all duration-300 group-hover:ring-primary/30">
          <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/5">
            {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="bg-muted/50 rounded-lg p-3 transition-all duration-300 hover:bg-muted/70">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-semibold text-sm text-primary">
                {comment.profiles?.username || 'Anonymous'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
                {currentUserId === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            
            <p className="text-sm break-words">{comment.content}</p>
            
            {mediaUrl && (
              <div className="mt-2">
                {mediaType === 'image' ? (
                  <img
                    src={mediaUrl}
                    alt="Comment media"
                    className="max-w-xs rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setShowMediaViewer(true)}
                  />
                ) : (
                  <video
                    src={mediaUrl}
                    className="max-w-xs rounded-lg border border-border cursor-pointer"
                    onClick={() => setShowMediaViewer(true)}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <CommentLikeButton 
              commentId={comment.id} 
              onLikeChange={onReplyAdded}
            />
            
            {level < 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Reply
              </Button>
            )}
          </div>

          {showReplyForm && (
            <div className="animate-fade-in">
              <CommentReplyForm
                postId={postId}
                parentCommentId={comment.id}
                onReplyAdded={() => {
                  setShowReplyForm(false);
                  onReplyAdded();
                }}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReplyAdded={onReplyAdded}
                  onCommentDeleted={onReplyAdded}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {mediaUrl && (
        <CommentMediaViewer
          mediaUrl={mediaUrl}
          mediaType={mediaType}
          isOpen={showMediaViewer}
          onClose={() => setShowMediaViewer(false)}
        />
      )}
    </div>
  );
};
