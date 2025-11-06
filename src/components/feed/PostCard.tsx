import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Trash2, Share2, MessageCircle, Repeat2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { CommentSection } from './CommentSection';
import { ImageViewer } from './ImageViewer';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    video_url?: string | null;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
      avatar_url: string | null;
    };
    reactions: { id: string; user_id: string }[];
    comments: any[];
  };
  currentUserId: string;
  onPostDeleted: () => void;
}

export const PostCard = ({ post, currentUserId, onPostDeleted }: PostCardProps) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(
    post.reactions.some((r) => r.user_id === currentUserId)
  );
  const [likeCount, setLikeCount] = useState(post.reactions.length);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments.length);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    try {
      if (liked) {
        const reaction = post.reactions.find((r) => r.user_id === currentUserId);
        if (reaction) {
          await supabase.from('reactions').delete().eq('id', reaction.id);
          setLiked(false);
          setLikeCount((prev) => prev - 1);
        }
      } else {
        await supabase.from('reactions').insert({
          post_id: post.id,
          user_id: currentUserId,
        });
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error: any) {
      toast.error('Failed to update reaction');
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      toast.success('Post deleted');
      onPostDeleted();
    } catch (error: any) {
      toast.error('Failed to delete post');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleRepost = async () => {
    try {
      const { error } = await supabase.from('shared_posts').insert({
        user_id: currentUserId,
        original_post_id: post.id,
      });

      if (error) throw error;
      toast.success('Post shared to your profile!');
    } catch (error: any) {
      toast.error('Failed to share post');
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${post.user_id}`);
  };

  return (
    <>
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="cursor-pointer" onClick={handleProfileClick}>
            {post.profiles.avatar_url && <AvatarImage src={post.profiles.avatar_url} />}
            <AvatarFallback>{post.profiles.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 
              className="font-semibold cursor-pointer hover:underline" 
              onClick={handleProfileClick}
            >
              {post.profiles.username}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {post.content && <p className="whitespace-pre-wrap">{post.content}</p>}
          
          {post.image_url && (
            <>
              <img
                src={post.image_url}
                alt="Post"
                className="w-full max-w-[1920px] max-h-[1920px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-contain mx-auto"
                onClick={() => setShowImageViewer(true)}
              />
              <ImageViewer
                imageUrl={post.image_url}
                isOpen={showImageViewer}
                onClose={() => setShowImageViewer(false)}
              />
            </>
          )}

          {post.video_url && (
            <video
              controls
              className="w-full max-w-[1920px] rounded-lg mx-auto"
              src={post.video_url}
            >
              Your browser does not support video playback.
            </video>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex items-center gap-4 w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={liked ? 'text-destructive' : ''}
            >
              <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
              {likeCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {commentCount}
            </Button>
            {post.user_id !== currentUserId && (
              <Button variant="ghost" size="sm" onClick={handleRepost}>
                <Repeat2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            {post.user_id === currentUserId && (
              <Button variant="ghost" size="sm" onClick={handleDelete} className="ml-auto">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          {showComments && (
            <CommentSection postId={post.id} onCommentAdded={() => setCommentCount(prev => prev + 1)} />
          )}
        </CardFooter>
      </Card>
    </>
  );
};
