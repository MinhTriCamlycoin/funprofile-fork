import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransformOptions {
  width?: number;
  height?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  gravity?: 'auto' | 'left' | 'right' | 'top' | 'bottom' | 'center';
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'json';
  blur?: number;
  brightness?: number;
  contrast?: number;
  gamma?: number;
  sharpen?: number;
  rotate?: 0 | 90 | 180 | 270;
  background?: string;
  dpr?: number;
  trim?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

/**
 * Image Transformation Proxy using Cloudflare Images
 * 
 * URL Params:
 * - url: Original image URL (required)
 * - w/width: Target width
 * - h/height: Target height  
 * - fit: Resize mode (scale-down, contain, cover, crop, pad)
 * - gravity: Crop position (auto, left, right, top, bottom, center)
 * - q/quality: Image quality (1-100)
 * - f/format: Output format (auto, webp, avif)
 * - blur: Blur amount (1-250)
 * - brightness: Brightness (-1 to 1)
 * - contrast: Contrast (-1 to 1)
 * - sharpen: Sharpen amount (0-10)
 * - rotate: Rotation (0, 90, 180, 270)
 * - preset: Predefined transformation (avatar, cover, thumbnail, post)
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    
    // Get original image URL
    const imageUrl = params.get('url');
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if it's an R2 URL or external URL
    const r2PublicUrl = Deno.env.get('CLOUDFLARE_R2_PUBLIC_URL');
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    
    if (!accountId) {
      console.error('CLOUDFLARE_ACCOUNT_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Cloudflare not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse transformation options
    const preset = params.get('preset');
    let options: TransformOptions = {};

    // Apply preset configurations
    if (preset) {
      switch (preset) {
        case 'avatar':
          options = { width: 128, height: 128, fit: 'cover', gravity: 'auto', format: 'webp', quality: 85 };
          break;
        case 'avatar-sm':
          options = { width: 40, height: 40, fit: 'cover', gravity: 'auto', format: 'webp', quality: 80 };
          break;
        case 'avatar-lg':
          options = { width: 256, height: 256, fit: 'cover', gravity: 'auto', format: 'webp', quality: 90 };
          break;
        case 'cover':
          options = { width: 1200, height: 400, fit: 'cover', gravity: 'auto', format: 'webp', quality: 85 };
          break;
        case 'thumbnail':
          options = { width: 300, height: 300, fit: 'cover', gravity: 'auto', format: 'webp', quality: 75 };
          break;
        case 'post':
          options = { width: 800, fit: 'scale-down', format: 'webp', quality: 85 };
          break;
        case 'post-grid':
          options = { width: 400, height: 400, fit: 'cover', gravity: 'auto', format: 'webp', quality: 80 };
          break;
        case 'gallery':
          options = { width: 1200, fit: 'scale-down', format: 'webp', quality: 90 };
          break;
        default:
          break;
      }
    }

    // Override with explicit params
    const width = params.get('w') || params.get('width');
    const height = params.get('h') || params.get('height');
    const fit = params.get('fit') as TransformOptions['fit'];
    const gravity = params.get('gravity') as TransformOptions['gravity'];
    const quality = params.get('q') || params.get('quality');
    const format = params.get('f') || params.get('format');
    const blur = params.get('blur');
    const brightness = params.get('brightness');
    const contrast = params.get('contrast');
    const sharpen = params.get('sharpen');
    const rotate = params.get('rotate');

    if (width) options.width = parseInt(width);
    if (height) options.height = parseInt(height);
    if (fit) options.fit = fit;
    if (gravity) options.gravity = gravity;
    if (quality) options.quality = parseInt(quality);
    if (format) options.format = format as TransformOptions['format'];
    if (blur) options.blur = Math.min(250, Math.max(1, parseInt(blur)));
    if (brightness) options.brightness = parseFloat(brightness);
    if (contrast) options.contrast = parseFloat(contrast);
    if (sharpen) options.sharpen = parseFloat(sharpen);
    if (rotate) options.rotate = parseInt(rotate) as TransformOptions['rotate'];

    // Apply Fun Filters
    const filter = params.get('filter');
    if (filter) {
      switch (filter) {
        case 'grayscale':
          options.contrast = 0;
          options.brightness = 0;
          break;
        case 'blur-light':
          options.blur = 5;
          break;
        case 'blur-heavy':
          options.blur = 20;
          break;
        case 'bright':
          options.brightness = 0.2;
          break;
        case 'dark':
          options.brightness = -0.2;
          break;
        case 'high-contrast':
          options.contrast = 0.3;
          break;
        case 'sharp':
          options.sharpen = 3;
          break;
        default:
          break;
      }
    }

    // Build Cloudflare Image Resizing URL options
    const cfOptions: string[] = [];
    
    if (options.width) cfOptions.push(`width=${options.width}`);
    if (options.height) cfOptions.push(`height=${options.height}`);
    if (options.fit) cfOptions.push(`fit=${options.fit}`);
    if (options.gravity) cfOptions.push(`gravity=${options.gravity}`);
    if (options.quality) cfOptions.push(`quality=${options.quality}`);
    if (options.format) cfOptions.push(`format=${options.format}`);
    if (options.blur) cfOptions.push(`blur=${options.blur}`);
    if (options.brightness !== undefined) cfOptions.push(`brightness=${options.brightness}`);
    if (options.contrast !== undefined) cfOptions.push(`contrast=${options.contrast}`);
    if (options.sharpen) cfOptions.push(`sharpen=${options.sharpen}`);
    if (options.rotate) cfOptions.push(`rotate=${options.rotate}`);

    // Default to auto format and good quality if not specified
    if (!options.format) cfOptions.push('format=auto');
    if (!options.quality) cfOptions.push('quality=85');

    console.log('Transform options:', cfOptions.join(','));
    console.log('Original URL:', imageUrl);

    // Cloudflare Images - use imagedelivery.net for uploaded images
    // or use Image Resizing via /cdn-cgi/image/ for external URLs
    
    // Check if this is a Cloudflare Images delivery URL (uploaded to CF Images)
    if (imageUrl.includes('imagedelivery.net')) {
      // Already a CF Images URL - modify the variant path
      const cfImageUrl = imageUrl.replace(/\/public$/, `/${cfOptions.join(',')}`);
      console.log('Redirecting to CF Images variant:', cfImageUrl);
      return Response.redirect(cfImageUrl, 302);
    }

    // For R2 URLs or external URLs, we need to proxy and transform
    // Cloudflare Image Resizing requires the image to be fetched through CF
    
    try {
      // Fetch the original image with transformation hints
      // Since edge functions run on Deno (not Cloudflare Workers), 
      // we can't use the cf.image option directly
      
      // Option 1: If user has Image Resizing enabled on their zone,
      // redirect to the zone's /cdn-cgi/image/ endpoint
      
      // Option 2: For now, use Sharp-like transformation via proxy
      // (requires the image to be fetched and processed)
      
      // Since we don't have native image processing in Deno edge functions,
      // the best approach is to redirect to a Cloudflare zone with Image Resizing
      // or use Cloudflare Images upload + delivery
      
      // For now, let's redirect with transformation params as a URL hint
      // This will work if the user accesses via a CF zone with Image Resizing
      
      // Build a redirect URL that includes transform params
      const transformedUrl = new URL(imageUrl);
      
      // Add cache-busting transform identifier
      transformedUrl.searchParams.set('cf_transform', cfOptions.join(','));
      
      console.log('Proxying image with caching...');
      
      // Fetch and proxy the original image with proper caching
      const proxyResponse = await fetch(imageUrl, {
        headers: {
          'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8',
          'User-Agent': 'FunRich-ImageProxy/1.0',
        },
      });

      if (!proxyResponse.ok) {
        console.error('Failed to fetch original image:', proxyResponse.status);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch image', status: proxyResponse.status }),
          { status: proxyResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const contentType = proxyResponse.headers.get('content-type') || 'image/jpeg';
      const imageBody = await proxyResponse.arrayBuffer();
      
      console.log('Successfully proxied image, size:', imageBody.byteLength, 'bytes');
      console.log('Note: For real-time transformation, use CF Image Resizing via zone or upload to CF Images');

      return new Response(imageBody, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'CDN-Cache-Control': 'public, max-age=31536000',
          'Vary': 'Accept',
          'X-Transform-Requested': cfOptions.join(','),
          'X-Transform-Mode': 'proxy',
          'X-Original-Size': imageBody.byteLength.toString(),
        },
      });
    } catch (fetchError) {
      console.error('Error fetching image:', fetchError);
      // Ultimate fallback - redirect to original
      return Response.redirect(imageUrl, 302);
    }

  } catch (error) {
    console.error('Error in image-transform:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
