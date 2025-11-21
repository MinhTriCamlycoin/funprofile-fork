import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { CommentMediaUpload } from './CommentMediaUpload';

const replySchema = z.object({
  content: z.string().max(1000, 'Reply must be less than 1000 characters'),
});

interface CommentReplyFormProps {
  postId: string;
  parentCommentId: string;
  onReplyAdded: () => void;
  onCancel: () => void;
}

export const CommentReplyForm = ({ 
  postId, 
  parentCommentId, 
  onReplyAdded, 
  onCancel 
}: CommentReplyFormProps) => {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl) return;

    const validation = replySchema.safeParse({ content: content.trim() });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please sign in to reply');
      setLoading(false);
      return;
    }

    const insertData: any = {
      post_id: postId,
      user_id: user.id,
      content: content.trim() || '',
      parent_comment_id: parentCommentId,
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
      toast.error('Failed to post reply');
    } else {
      setContent('');
      setMediaUrl(null);
      setMediaType(null);
      onReplyAdded();
      toast.success('Reply posted!');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-3 bg-background/50 rounded-lg border border-border animate-scale-in">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        className="min-h-[60px] resize-none"
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
        
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button 
            type="submit" 
            size="sm" 
            disabled={loading || (!content.trim() && !mediaUrl)}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Reply
          </Button>
        </div>
      </div>
    </form>
  );
};
