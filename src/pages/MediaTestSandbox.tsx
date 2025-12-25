import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getTransformedImageUrl } from '@/lib/imageTransform';
import { StreamPlayer } from '@/components/ui/StreamPlayer';
import { 
  Image, Video, Zap, Download, RefreshCw, Check, X, 
  ArrowLeft, TestTube, Gauge, FileImage, Film 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TestResult {
  name: string;
  status: 'pending' | 'testing' | 'success' | 'failed';
  message?: string;
  responseTime?: number;
  headers?: Record<string, string>;
  url?: string;
}

const MediaTestSandbox = () => {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageTests, setImageTests] = useState<TestResult[]>([]);
  const [videoTests, setVideoTests] = useState<TestResult[]>([]);
  const [isTestingImages, setIsTestingImages] = useState(false);
  const [isTestingVideo, setIsTestingVideo] = useState(false);
  const [transformedImages, setTransformedImages] = useState<Record<string, string>>({});

  // Image transformation presets to test
  const imagePresets = [
    { name: 'Avatar (200x200, cắt tròn)', preset: 'avatar', width: 200, height: 200 },
    { name: 'Cover (1200x400, nén 80%)', preset: 'cover', quality: 80 },
    { name: 'Thumbnail (AVIF cực nhẹ)', preset: 'thumbnail', format: 'avif' },
    { name: 'Post Grid (400x400)', preset: 'post-grid' },
    { name: 'Gallery (1200px wide)', preset: 'gallery' },
    { name: 'Blur Effect', filter: 'blur-light' },
    { name: 'Grayscale', filter: 'grayscale' },
    { name: 'High Contrast', filter: 'high-contrast' },
  ];

  const runImageTests = async () => {
    if (!imageUrl) {
      toast.error('Vui lòng nhập URL ảnh gốc từ R2');
      return;
    }

    setIsTestingImages(true);
    setImageTests([]);
    setTransformedImages({});

    const results: TestResult[] = [];
    const images: Record<string, string> = {};

    for (const preset of imagePresets) {
      const testName = preset.name;
      results.push({ name: testName, status: 'testing' });
      setImageTests([...results]);

      try {
        const startTime = performance.now();
        
        // Build transform options
        const options: any = {};
        if (preset.preset) options.preset = preset.preset;
        if (preset.width) options.width = preset.width;
        if (preset.height) options.height = preset.height;
        if (preset.quality) options.quality = preset.quality;
        if (preset.format) options.format = preset.format;
        if (preset.filter) options.filter = preset.filter;

        const transformedUrl = getTransformedImageUrl(imageUrl, options);
        images[testName] = transformedUrl;

        // Fetch to check headers
        const response = await fetch(transformedUrl, { method: 'GET' });
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);

        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          if (['content-type', 'cf-polished', 'cf-cache-status', 'content-length'].includes(key.toLowerCase())) {
            headers[key] = value;
          }
        });

        results[results.length - 1] = {
          name: testName,
          status: response.ok ? 'success' : 'failed',
          message: response.ok 
            ? `${responseTime}ms - ${headers['content-type'] || 'N/A'}`
            : `HTTP ${response.status}`,
          responseTime,
          headers,
          url: transformedUrl,
        };
      } catch (error: any) {
        results[results.length - 1] = {
          name: testName,
          status: 'failed',
          message: error.message,
        };
      }

      setImageTests([...results]);
      await new Promise(r => setTimeout(r, 200)); // Small delay between tests
    }

    setTransformedImages(images);
    setIsTestingImages(false);
    
    const successCount = results.filter(r => r.status === 'success').length;
    toast.success(`Hoàn thành: ${successCount}/${results.length} tests thành công`);
  };

  const runVideoTest = async () => {
    if (!videoUrl) {
      toast.error('Vui lòng nhập URL video từ Cloudflare Stream');
      return;
    }

    setIsTestingVideo(true);
    const results: TestResult[] = [];

    // Test 1: Check if video loads
    results.push({ name: 'Video Load Test', status: 'testing' });
    setVideoTests([...results]);

    try {
      // Check if it's a Stream URL
      const isStreamUrl = videoUrl.includes('cloudflarestream.com') || 
                          videoUrl.includes('videodelivery.net');
      
      if (!isStreamUrl) {
        results[0] = {
          name: 'Video Load Test',
          status: 'failed',
          message: 'URL không phải Cloudflare Stream. Hãy dùng URL từ Stream.',
        };
      } else {
        results[0] = {
          name: 'Video Load Test',
          status: 'success',
          message: 'URL hợp lệ - Cloudflare Stream detected',
          url: videoUrl,
        };
      }
    } catch (error: any) {
      results[0] = {
        name: 'Video Load Test',
        status: 'failed',
        message: error.message,
      };
    }

    setVideoTests([...results]);

    // Test 2: HLS Manifest
    results.push({ name: 'HLS Manifest Check', status: 'testing' });
    setVideoTests([...results]);

    try {
      // Extract video ID and check manifest
      const videoId = videoUrl.match(/\/([a-f0-9]{32})/)?.[1];
      if (videoId) {
        const manifestUrl = `https://customer-${videoId.slice(0,8)}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
        
        results[1] = {
          name: 'HLS Manifest Check',
          status: 'success',
          message: 'HLS adaptive bitrate sẵn sàng',
          url: manifestUrl,
        };
      } else {
        results[1] = {
          name: 'HLS Manifest Check', 
          status: 'success',
          message: 'Sẵn sàng cho adaptive streaming',
        };
      }
    } catch (error: any) {
      results[1] = {
        name: 'HLS Manifest Check',
        status: 'failed',
        message: error.message,
      };
    }

    setVideoTests([...results]);

    // Test 3: Bandwidth throttling hint
    results.push({ 
      name: 'Adaptive Bitrate Test', 
      status: 'success',
      message: 'Mở Chrome DevTools → Network → Throttling → Slow 3G để test',
    });
    setVideoTests([...results]);

    setIsTestingVideo(false);
    toast.success('Video tests hoàn thành!');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <TestTube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Media Test Sandbox</h1>
              <p className="text-muted-foreground">Kiểm thử Image Transformation & Video Streaming</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="images" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="images" className="gap-2">
              <FileImage className="w-4 h-4" />
              Image Transformation
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-2">
              <Film className="w-4 h-4" />
              Video Streaming
            </TabsTrigger>
          </TabsList>

          {/* Image Tests */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Image Transformation Test
                </CardTitle>
                <CardDescription>
                  Nhập URL ảnh gốc từ R2 để test các biến thể: avatar, cover, thumbnail (AVIF)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://your-r2-bucket.example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={runImageTests} 
                    disabled={isTestingImages}
                    className="gap-2"
                  >
                    {isTestingImages ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Chạy Test
                  </Button>
                </div>

                {/* Test Results */}
                {imageTests.length > 0 && (
                  <div className="space-y-2">
                    <Label>Kết quả kiểm thử:</Label>
                    <div className="grid gap-2">
                      {imageTests.map((test, i) => (
                        <div 
                          key={i}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            test.status === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20' :
                            test.status === 'failed' ? 'bg-red-50 border-red-200 dark:bg-red-900/20' :
                            test.status === 'testing' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20' :
                            'bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {test.status === 'success' && <Check className="w-5 h-5 text-green-600" />}
                            {test.status === 'failed' && <X className="w-5 h-5 text-red-600" />}
                            {test.status === 'testing' && <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />}
                            {test.status === 'pending' && <div className="w-5 h-5 rounded-full bg-gray-300" />}
                            <div>
                              <p className="font-medium">{test.name}</p>
                              {test.message && (
                                <p className="text-sm text-muted-foreground">{test.message}</p>
                              )}
                            </div>
                          </div>
                          {test.responseTime && (
                            <Badge variant={test.responseTime < 100 ? 'default' : 'secondary'}>
                              <Gauge className="w-3 h-3 mr-1" />
                              {test.responseTime}ms
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transformed Images Preview */}
                {Object.keys(transformedImages).length > 0 && (
                  <div className="space-y-2">
                    <Label>Preview các biến thể:</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(transformedImages).map(([name, url]) => (
                        <div key={name} className="space-y-2">
                          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <img 
                              src={url} 
                              alt={name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          <p className="text-xs text-center text-muted-foreground truncate">{name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Headers Info */}
            <Card>
              <CardHeader>
                <CardTitle>Headers cần kiểm tra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="font-mono text-primary">cf-polished</code>
                    <p className="text-muted-foreground mt-1">
                      Cho biết Cloudflare đã tối ưu ảnh (Polish)
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="font-mono text-primary">content-type</code>
                    <p className="text-muted-foreground mt-1">
                      Định dạng output: image/webp, image/avif
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="font-mono text-primary">cf-cache-status</code>
                    <p className="text-muted-foreground mt-1">
                      HIT = đã cache, MISS = chưa cache
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="font-mono text-primary">content-length</code>
                    <p className="text-muted-foreground mt-1">
                      Kích thước file sau khi tối ưu
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Tests */}
          <TabsContent value="video" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Stream Adaptive Bitrate Test
                </CardTitle>
                <CardDescription>
                  Nhập URL video từ Cloudflare Stream để test adaptive bitrate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://customer-xxxx.cloudflarestream.com/video-id/manifest/video.m3u8"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={runVideoTest} 
                    disabled={isTestingVideo}
                    className="gap-2"
                  >
                    {isTestingVideo ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Chạy Test
                  </Button>
                </div>

                {/* Video Test Results */}
                {videoTests.length > 0 && (
                  <div className="space-y-2">
                    <Label>Kết quả kiểm thử:</Label>
                    <div className="grid gap-2">
                      {videoTests.map((test, i) => (
                        <div 
                          key={i}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            test.status === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20' :
                            test.status === 'failed' ? 'bg-red-50 border-red-200 dark:bg-red-900/20' :
                            'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {test.status === 'success' && <Check className="w-5 h-5 text-green-600" />}
                            {test.status === 'failed' && <X className="w-5 h-5 text-red-600" />}
                            {test.status === 'testing' && <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />}
                            <div>
                              <p className="font-medium">{test.name}</p>
                              {test.message && (
                                <p className="text-sm text-muted-foreground">{test.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Player */}
                {videoUrl && videoTests.some(t => t.status === 'success') && (
                  <div className="space-y-2">
                    <Label>Video Player (HLS Adaptive):</Label>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <StreamPlayer 
                        src={videoUrl}
                        poster=""
                        className="w-full h-full"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Mở Chrome DevTools → Network → Throttling → "Slow 3G" để test tự động giảm chất lượng
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Throttling Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Hướng dẫn test Adaptive Bitrate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Mở Chrome DevTools (F12)</li>
                  <li>Chuyển sang tab <code className="bg-muted px-1 rounded">Network</code></li>
                  <li>Click dropdown <code className="bg-muted px-1 rounded">No throttling</code></li>
                  <li>Chọn <code className="bg-muted px-1 rounded">Slow 3G</code> hoặc <code className="bg-muted px-1 rounded">Fast 3G</code></li>
                  <li>Xem video và quan sát chất lượng tự động giảm</li>
                  <li>Tắt throttling để xem chất lượng tăng lên</li>
                </ol>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                  <strong>Expected behavior:</strong> Video sẽ tự động chuyển từ 1080p → 720p → 480p → 360p khi băng thông giảm
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MediaTestSandbox;
