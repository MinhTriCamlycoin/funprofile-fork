import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAccessToken } from "../_shared/jwt.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const SYNC_RATE_LIMIT = 60; // 60 requests per minute per client
const USER_RATE_LIMIT = 120; // 120 total syncs per minute per user
const RATE_WINDOW = 60 * 1000; // 1 minute

// Rate limit maps
const clientRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const userRateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Validation configuration
const validationRules = {
  maxDataSize: 50 * 1024, // 50KB
  maxDepth: 5,
  reservedKeys: ['user_id', 'fun_id', 'wallet_address', 'soul_nft', 'id', 'created_at', 'updated_at']
};

// Financial data fields that support delta updates
const FINANCIAL_FIELDS = ['total_deposit', 'total_withdraw', 'total_bet', 'total_win', 'total_loss', 'total_profit'];

// Check rate limit
function checkRateLimit(key: string, map: Map<string, { count: number; resetAt: number }>, limit: number): boolean {
  const now = Date.now();
  const record = map.get(key);
  
  if (!record || now > record.resetAt) {
    map.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// Get object depth
function getObjectDepth(obj: unknown, currentDepth = 0): number {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return currentDepth;
  }
  
  let maxDepth = currentDepth;
  for (const key in obj as Record<string, unknown>) {
    const depth = getObjectDepth((obj as Record<string, unknown>)[key], currentDepth + 1);
    if (depth > maxDepth) maxDepth = depth;
  }
  return maxDepth;
}

// Check for reserved keys
function hasReservedKeys(obj: unknown, reservedKeys: string[]): string | null {
  if (typeof obj !== 'object' || obj === null) return null;
  
  for (const key in obj as Record<string, unknown>) {
    if (reservedKeys.includes(key.toLowerCase())) {
      return key;
    }
    const value = (obj as Record<string, unknown>)[key];
    if (typeof value === 'object' && !Array.isArray(value)) {
      const found = hasReservedKeys(value, reservedKeys);
      if (found) return found;
    }
  }
  return null;
}

// Deep merge function
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>, mode: string): Record<string, unknown> {
  if (mode === 'replace') {
    return source;
  }
  
  if (mode === 'append') {
    const result = { ...target };
    for (const key in source) {
      if (!(key in result)) {
        result[key] = source[key];
      } else if (Array.isArray(source[key]) && Array.isArray(result[key])) {
        result[key] = [...new Set([...(result[key] as unknown[]), ...(source[key] as unknown[])])];
      }
    }
    return result;
  }
  
  // Default: merge mode
  const result = { ...target };
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      result[key] = deepMerge((result[key] as Record<string, unknown>) || {}, source[key] as Record<string, unknown>, mode);
    } else if (Array.isArray(source[key])) {
      const existing = Array.isArray(result[key]) ? (result[key] as unknown[]) : [];
      result[key] = [...new Set([...existing, ...(source[key] as unknown[])])];
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

interface FinancialData {
  total_deposit?: number;
  total_withdraw?: number;
  total_bet?: number;
  total_win?: number;
  total_loss?: number;
  total_profit?: number;
}

interface FinancialDelta {
  deposit_delta?: number;
  withdraw_delta?: number;
  bet_delta?: number;
  win_delta?: number;
  loss_delta?: number;
  profit_delta?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'invalid_request',
        error_description: 'Method not allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract and validate token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'invalid_token',
        error_description: 'Missing or invalid Authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const accessToken = authHeader.substring(7);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try JWT verification first (fast path)
    let userId: string;
    let clientId: string;
    let profile: { fun_id?: string; username?: string } | null = null;

    const jwtPayload = await verifyAccessToken(accessToken);
    
    if (jwtPayload) {
      // JWT valid - extract info from claims
      userId = jwtPayload.sub;
      
      // Get client_id from token record (we need this for platform isolation)
      const { data: tokenData } = await supabase
        .from('cross_platform_tokens')
        .select('client_id')
        .eq('user_id', userId)
        .eq('is_revoked', false)
        .order('last_used_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      clientId = tokenData?.client_id || '';
      profile = { fun_id: jwtPayload.fun_id, username: jwtPayload.username };
      
      if (!clientId) {
        return new Response(JSON.stringify({
          error: 'invalid_token',
          error_description: 'No active session found for this token'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Fallback: validate opaque token in database
      const { data: tokenData, error: tokenError } = await supabase
        .from('cross_platform_tokens')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            fun_id
          )
        `)
        .eq('access_token', accessToken)
        .eq('is_revoked', false)
        .single();

      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({
          error: 'invalid_token',
          error_description: 'Token not found or revoked'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check token expiration
      if (new Date(tokenData.access_token_expires_at) < new Date()) {
        return new Response(JSON.stringify({
          error: 'invalid_token',
          error_description: 'Token has expired'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      clientId = tokenData.client_id;
      userId = tokenData.user_id;
      profile = tokenData.profiles;
    }

    // Check client rate limit
    if (!checkRateLimit(clientId, clientRateLimitMap, SYNC_RATE_LIMIT)) {
      return new Response(JSON.stringify({
        error: 'rate_limit_exceeded',
        error_description: 'Client rate limit exceeded. Maximum 60 syncs per minute.',
        retry_after: 60
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }

    // Check user rate limit
    if (!checkRateLimit(userId, userRateLimitMap, USER_RATE_LIMIT)) {
      return new Response(JSON.stringify({
        error: 'rate_limit_exceeded',
        error_description: 'User rate limit exceeded. Maximum 120 syncs per minute across all platforms.',
        retry_after: 60
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({
        error: 'invalid_request',
        error_description: 'Invalid JSON body'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { 
      sync_mode = 'merge', 
      data, 
      categories, 
      client_timestamp,
      // NEW: Financial data support
      financial_data,
      financial_delta
    } = body;

    // Validate sync_mode
    if (!['merge', 'replace', 'append', 'delta'].includes(sync_mode)) {
      return new Response(JSON.stringify({
        error: 'validation_failed',
        error_description: 'Invalid sync_mode. Must be "merge", "replace", "append", or "delta"'
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const syncedAt = new Date().toISOString();
    let syncCount = 0;
    let categoriesUpdated: string[] = [];
    let dataSize = 0;
    let financialResult: FinancialData | null = null;

    // ==================== FINANCIAL DATA SYNC ====================
    if (financial_data || financial_delta) {
      // Get existing financial data for this platform
      const { data: existingFinancial } = await supabase
        .from('platform_financial_data')
        .select('*')
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .single();

      const currentFinancial: FinancialData = {
        total_deposit: existingFinancial?.total_deposit || 0,
        total_withdraw: existingFinancial?.total_withdraw || 0,
        total_bet: existingFinancial?.total_bet || 0,
        total_win: existingFinancial?.total_win || 0,
        total_loss: existingFinancial?.total_loss || 0,
        total_profit: existingFinancial?.total_profit || 0
      };

      let newFinancial: FinancialData;

      if (sync_mode === 'delta' && financial_delta) {
        // Delta mode: add deltas to existing values
        const delta = financial_delta as FinancialDelta;
        newFinancial = {
          total_deposit: currentFinancial.total_deposit! + (delta.deposit_delta || 0),
          total_withdraw: currentFinancial.total_withdraw! + (delta.withdraw_delta || 0),
          total_bet: currentFinancial.total_bet! + (delta.bet_delta || 0),
          total_win: currentFinancial.total_win! + (delta.win_delta || 0),
          total_loss: currentFinancial.total_loss! + (delta.loss_delta || 0),
          total_profit: currentFinancial.total_profit! + (delta.profit_delta || 0)
        };
      } else if (financial_data) {
        // Replace mode: use provided values
        const fd = financial_data as FinancialData;
        newFinancial = {
          total_deposit: fd.total_deposit ?? currentFinancial.total_deposit,
          total_withdraw: fd.total_withdraw ?? currentFinancial.total_withdraw,
          total_bet: fd.total_bet ?? currentFinancial.total_bet,
          total_win: fd.total_win ?? currentFinancial.total_win,
          total_loss: fd.total_loss ?? currentFinancial.total_loss,
          total_profit: fd.total_profit ?? currentFinancial.total_profit
        };
      } else {
        newFinancial = currentFinancial;
      }

      // Upsert financial data
      const { error: financialError } = await supabase
        .from('platform_financial_data')
        .upsert({
          user_id: userId,
          client_id: clientId,
          total_deposit: newFinancial.total_deposit,
          total_withdraw: newFinancial.total_withdraw,
          total_bet: newFinancial.total_bet,
          total_win: newFinancial.total_win,
          total_loss: newFinancial.total_loss,
          total_profit: newFinancial.total_profit,
          sync_count: (existingFinancial?.sync_count || 0) + 1,
          client_timestamp: client_timestamp || null,
          last_sync_at: syncedAt,
          updated_at: syncedAt
        }, {
          onConflict: 'user_id,client_id'
        });

      if (financialError) {
        console.error('Financial data upsert error:', financialError);
        return new Response(JSON.stringify({
          error: 'server_error',
          error_description: 'Failed to sync financial data'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      financialResult = newFinancial;
      categoriesUpdated.push('financial_data');
      
      console.log(`[sso-sync-data] Synced financial data for user ${userId} from ${clientId}. Mode: ${sync_mode}`);
    }

    // ==================== GAME/PLATFORM DATA SYNC ====================
    if (data && typeof data === 'object') {
      // Validate data
      dataSize = new TextEncoder().encode(JSON.stringify(data)).length;
      if (dataSize > validationRules.maxDataSize) {
        return new Response(JSON.stringify({
          error: 'payload_too_large',
          error_description: 'Data exceeds maximum allowed size',
          details: { max_size: validationRules.maxDataSize, actual_size: dataSize }
        }), {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check object depth
      const depth = getObjectDepth(data);
      if (depth > validationRules.maxDepth) {
        return new Response(JSON.stringify({
          error: 'validation_failed',
          error_description: `Data exceeds maximum nesting depth of ${validationRules.maxDepth}`,
          details: { max_depth: validationRules.maxDepth, actual_depth: depth }
        }), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check for reserved keys
      const reservedKey = hasReservedKeys(data, validationRules.reservedKeys);
      if (reservedKey) {
        return new Response(JSON.stringify({
          error: 'validation_failed',
          error_description: `Reserved key "${reservedKey}" cannot be synced`,
          details: { reserved_keys: validationRules.reservedKeys }
        }), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get existing platform data
      const { data: existingPlatformData } = await supabase
        .from('platform_user_data')
        .select('data, sync_count')
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .single();

      const existingData = (existingPlatformData?.data as Record<string, unknown>) || {};
      const previousSyncCount = existingPlatformData?.sync_count || 0;

      // Apply merge logic (use 'merge' even for 'delta' mode on game data)
      const effectiveMode = sync_mode === 'delta' ? 'merge' : sync_mode;
      const mergedData = deepMerge(existingData, data as Record<string, unknown>, effectiveMode);

      syncCount = previousSyncCount + 1;

      // Upsert platform data
      const { error: upsertError } = await supabase
        .from('platform_user_data')
        .upsert({
          user_id: userId,
          client_id: clientId,
          data: mergedData,
          sync_count: syncCount,
          last_sync_mode: sync_mode,
          client_timestamp: client_timestamp || null,
          synced_at: syncedAt,
          updated_at: syncedAt
        }, {
          onConflict: 'user_id,client_id'
        });

      if (upsertError) {
        console.error('Database upsert error:', upsertError);
        return new Response(JSON.stringify({
          error: 'server_error',
          error_description: 'Failed to sync data'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      categoriesUpdated = [...categoriesUpdated, ...(categories || Object.keys(data))];
    }

    // Update token last_used_at
    await supabase
      .from('cross_platform_tokens')
      .update({ last_used_at: syncedAt })
      .eq('user_id', userId)
      .eq('client_id', clientId);

    console.log(`[sso-sync-data] Synced data for user ${userId} from ${clientId}. Mode: ${sync_mode}, Size: ${dataSize} bytes, Count: ${syncCount}`);

    // Build response
    const response: Record<string, unknown> = {
      success: true,
      synced_at: syncedAt,
      sync_mode: sync_mode,
      sync_count: syncCount,
      categories_updated: categoriesUpdated,
      data_size: dataSize,
      user: {
        fun_id: profile?.fun_id,
        username: profile?.username
      }
    };

    // Include financial summary if synced
    if (financialResult) {
      response.financial_data = financialResult;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in sso-sync-data:', error);
    return new Response(JSON.stringify({
      error: 'server_error',
      error_description: 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
