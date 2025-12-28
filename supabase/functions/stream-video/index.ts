import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Enhanced CORS headers for TUS protocol support
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upload-length, upload-metadata, tus-resumable, upload-offset, upload-defer-length',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, HEAD, OPTIONS, DELETE',
  'Access-Control-Expose-Headers': 'Location, Upload-Offset, Upload-Length, Tus-Resumable, Tus-Version, Tus-Extension, Tus-Max-Size, stream-media-id',
  'Access-Control-Max-Age': '86400',
};

const CLOUDFLARE_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
const CLOUDFLARE_STREAM_API_TOKEN = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');

serve(async (req) => {
  // Handle CORS preflight - return all TUS-required headers
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Validate environment
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_STREAM_API_TOKEN) {
      console.error('[stream-video] Missing environment variables:', {
        hasAccountId: !!CLOUDFLARE_ACCOUNT_ID,
        hasApiToken: !!CLOUDFLARE_STREAM_API_TOKEN,
      });
      throw new Error('Missing Cloudflare Stream configuration');
    }

    // Parse request
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // TUS-PROXY: Special handling for direct TUS proxy requests (no JSON body parsing)
    if (action === 'tus-proxy') {
      console.log('[stream-video] TUS Proxy request received');
      
      // Auth check
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        throw new Error('Unauthorized');
      }

      // Get TUS headers from client request
      const uploadLength = req.headers.get('Upload-Length');
      const uploadMetadata = req.headers.get('Upload-Metadata');
      const tusResumable = req.headers.get('Tus-Resumable') || '1.0.0';

      console.log('[stream-video] TUS Proxy headers:', {
        uploadLength,
        uploadMetadata,
        tusResumable,
        userId: user.id,
      });

      // Forward request to Cloudflare Stream with direct_user=true
      const cfResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?direct_user=true`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
            'Tus-Resumable': tusResumable,
            'Upload-Length': uploadLength || '0',
            'Upload-Metadata': uploadMetadata || '',
          },
        }
      );

      console.log('[stream-video] Cloudflare response status:', cfResponse.status);
      
      // Get the Location header (this is the actual TUS upload endpoint)
      const location = cfResponse.headers.get('Location');
      const streamMediaId = cfResponse.headers.get('stream-media-id');
      
      console.log('[stream-video] TUS Proxy response:', {
        location,
        streamMediaId,
        cfStatus: cfResponse.status,
      });

      if (!location) {
        const errorBody = await cfResponse.text();
        console.error('[stream-video] No Location header from CF:', errorBody);
        throw new Error('Cloudflare did not return upload URL');
      }

      // Return response with Location header - this is critical for TUS client
      return new Response(null, {
        status: cfResponse.status,
        headers: {
          ...corsHeaders,
          'Location': location,
          'stream-media-id': streamMediaId || '',
          'Tus-Resumable': '1.0.0',
        },
      });
    }

    // For other actions, parse body
    const body = await req.json().catch(() => ({}));
    const bodyAction = body?.action as string | null;
    const finalAction = action || bodyAction;

    if (!finalAction) {
      throw new Error('Missing action');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`[stream-video] Action: ${finalAction}, User: ${user.id}`);

    switch (finalAction) {
      case 'get-tus-endpoint': {
        // Return TUS endpoint for resumable uploads
        const tusEndpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;
        
        console.log('[stream-video] Returning TUS endpoint');

        return new Response(JSON.stringify({
          tusEndpoint,
          apiToken: CLOUDFLARE_STREAM_API_TOKEN,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-upload-url': {
        // Create TUS upload URL for resumable uploads (One-time upload URL)
        const maxDurationSeconds = body.maxDurationSeconds || 900;

        console.log('[stream-video] Creating TUS upload URL, maxDuration:', maxDurationSeconds);

        // Use the Direct Creator Upload endpoint which returns a one-time TUS URL
        const uploadMetadata = [
          `maxDurationSeconds ${btoa(maxDurationSeconds.toString())}`,
          `requiresignedurls ${btoa('false')}`,
          `name ${btoa(`upload_${user.id}_${Date.now()}`)}`,
        ].join(',');

        console.log('[stream-video] TUS metadata:', uploadMetadata);

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream?direct_user=true`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
              'Tus-Resumable': '1.0.0',
              'Upload-Length': body.fileSize?.toString() || '0',
              'Upload-Metadata': uploadMetadata,
            },
          }
        );

        console.log('[stream-video] TUS response status:', response.status);
        console.log('[stream-video] TUS response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[stream-video] Cloudflare TUS error:', errorText);
          throw new Error(`Failed to create TUS upload URL: ${response.status} - ${errorText}`);
        }

        const uploadUrl = response.headers.get('Location');
        const streamMediaId = response.headers.get('stream-media-id');

        if (!uploadUrl) {
          const responseData = await response.json().catch(() => null);
          console.log('[stream-video] Response body:', responseData);
          
          if (responseData?.result?.uploadURL) {
            return new Response(JSON.stringify({
              uploadUrl: responseData.result.uploadURL,
              uid: responseData.result.uid,
              expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          throw new Error('No upload URL returned from Cloudflare');
        }

        const result = {
          uploadUrl,
          uid: streamMediaId,
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        };

        console.log('[stream-video] TUS Upload URL created:', result);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'direct-upload': {
        const maxDurationSeconds = body.maxDurationSeconds || 900;

        console.log('[stream-video] Creating direct upload URL, maxDuration:', maxDurationSeconds);

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              maxDurationSeconds,
              requireSignedURLs: false,
              allowedOrigins: ['*'],
              meta: {
                userId: user.id,
                uploadedAt: new Date().toISOString(),
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[stream-video] Direct upload error:', errorText);
          throw new Error(`Failed to create direct upload: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[stream-video] Direct upload created:', data.result?.uid);
        
        return new Response(JSON.stringify({
          uploadUrl: data.result.uploadURL,
          uid: data.result.uid,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check-status': {
        const { uid } = body;

        if (!uid) {
          throw new Error('Missing video UID');
        }

        console.log('[stream-video] Checking status for:', uid);

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${uid}`,
          {
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[stream-video] Check status error:', errorText);
          throw new Error(`Failed to check status: ${response.status}`);
        }

        const data = await response.json();
        const video = data.result;

        console.log('[stream-video] Video status:', video?.status?.state, 'readyToStream:', video?.readyToStream);

        return new Response(JSON.stringify({
          uid: video.uid,
          status: video.status,
          readyToStream: video.readyToStream,
          duration: video.duration,
          thumbnail: video.thumbnail,
          playback: video.playback,
          preview: video.preview,
          meta: video.meta,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-playback-url': {
        const { uid } = body;

        if (!uid) {
          throw new Error('Missing video UID');
        }

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${uid}`,
          {
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to get playback URL: ${response.status}`);
        }

        const data = await response.json();
        const video = data.result;

        return new Response(JSON.stringify({
          uid: video.uid,
          playback: {
            hls: video.playback?.hls,
            dash: video.playback?.dash,
          },
          thumbnail: video.thumbnail,
          preview: video.preview,
          duration: video.duration,
          readyToStream: video.readyToStream,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { uid } = body;

        if (!uid) {
          throw new Error('Missing video UID');
        }

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${uid}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
            },
          }
        );

        if (!response.ok && response.status !== 404) {
          throw new Error(`Failed to delete video: ${response.status}`);
        }

        console.log('[stream-video] Video deleted:', uid);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update-video-settings': {
        const { uid, requireSignedURLs = false, allowedOrigins = ['*'] } = body;

        if (!uid) {
          throw new Error('Missing video UID');
        }

        console.log('[stream-video] Updating video settings for:', uid, { requireSignedURLs, allowedOrigins });

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${uid}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requireSignedURLs,
              allowedOrigins,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[stream-video] Update settings error:', errorText);
          throw new Error(`Failed to update video settings: ${response.status}`);
        }

        const data = await response.json();
        console.log('[stream-video] Video settings updated:', data.result?.uid);

        return new Response(JSON.stringify({
          success: true,
          uid,
          requireSignedURLs: data.result?.requireSignedURLs,
          allowedOrigins: data.result?.allowedOrigins,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${finalAction}`);
    }
  } catch (error) {
    console.error('[stream-video] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: errorMessage === 'Unauthorized' ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
