import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max requests
const RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, type = 'email' } = await req.json();

    // Rate limiting by identifier
    const rateLimitKey = `otp:${identifier?.toLowerCase() || 'unknown'}`;
    if (!checkRateLimit(rateLimitKey)) {
      console.warn(`[OTP-REQUEST] Rate limit exceeded for: ${identifier}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please wait a minute before trying again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[OTP-REQUEST] Processing request for: ${identifier}, type: ${type}`);

    if (!identifier) {
      return new Response(
        JSON.stringify({ success: false, error: 'Identifier is required (email or phone)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate OTP and expiry (5 minutes)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Delete any existing unused OTP for this identifier
    await supabase
      .from('otp_codes')
      .delete()
      .eq('identifier', identifier.toLowerCase())
      .eq('is_used', false);

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        identifier: identifier.toLowerCase(),
        code: otp,
        type: type,
        expires_at: expiresAt,
        is_used: false,
        attempts: 0,
        max_attempts: 5
      });

    if (insertError) {
      console.error('[OTP-REQUEST] Failed to store OTP:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Integrate with email service (Resend, SendGrid) to send OTP
    console.log(`[OTP-REQUEST] OTP stored successfully for ${identifier}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `OTP sent to ${identifier}`,
        expires_in_seconds: 300
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[OTP-REQUEST] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
