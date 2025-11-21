import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Image, Video, X } from 'lucide-react';
import { toast } from 'sonner';

interface CommentMediaUploadProps {
  onMediaUploaded: (url: string, type: 'image' | 'video') => void;
  onMediaRemoved: () => void;
}

export const CommentMediaUpload = ({ 
  onMediaUploaded, 
  onMediaRemoved 
}: CommentMediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for videos
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${type === 'image' ? '5MB' : '50MB'}`);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to upload media');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('comment-media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('comment-media')
        .getPublicUrl(data.path);

      setPreview({ url: publicUrl, type });
      onMediaUploaded(publicUrl, type);
      toast.success('Media uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onMediaRemoved();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {!preview && (
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, 'image')}
            className="hidden"
            id="comment-image-upload"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => document.getElementById('comment-image-upload')?.click()}
            disabled={uploading}
            className="text-muted-foreground hover:text-foreground"
          >
            <Image className="w-4 h-4" />
          </Button>

          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleFileSelect(e, 'video')}
            className="hidden"
            id="comment-video-upload"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => document.getElementById('comment-video-upload')?.click()}
            disabled={uploading}
            className="text-muted-foreground hover:text-foreground"
          >
            <Video className="w-4 h-4" />
          </Button>
        </div>
      )}

      {preview && (
        <div className="relative inline-block group">
          {preview.type === 'image' ? (
            <img 
              src={preview.url} 
              alt="Preview" 
              className="max-w-xs max-h-32 rounded-lg border border-border"
            />
          ) : (
            <video 
              src={preview.url} 
              className="max-w-xs max-h-32 rounded-lg border border-border"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
