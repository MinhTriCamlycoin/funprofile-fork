/**
 * Fun Profile SSO SDK
 * 
 * SDK for integrating Fun Farm, Fun Play, Fun Planet with Fun Profile SSO.
 * 
 * @example Basic Setup
 * ```typescript
 * import { FunProfileClient } from '@/lib/sso-sdk';
 * 
 * const funProfile = new FunProfileClient({
 *   clientId: 'fun_farm_client',
 *   clientSecret: 'your_secret',
 *   redirectUri: 'https://funfarm.fun/callback',
 *   scopes: ['profile', 'email', 'wallet', 'rewards']
 * });
 * ```
 * 
 * @example OAuth Login Flow
 * ```typescript
 * // Step 1: Redirect to Fun Profile login
 * const loginUrl = await funProfile.startAuth();
 * window.location.href = loginUrl;
 * 
 * // Step 2: Handle callback
 * const params = new URLSearchParams(window.location.search);
 * const result = await funProfile.handleCallback(
 *   params.get('code')!,
 *   params.get('state')!
 * );
 * console.log('Logged in as', result.user.username);
 * ```
 * 
 * @example Register New User
 * ```typescript
 * const result = await funProfile.register({
 *   email: 'farmer@example.com',
 *   username: 'farmer123',
 *   platformData: { farming_level: 1 }
 * });
 * console.log('Welcome', result.user.funId);
 * ```
 * 
 * @example Sync Platform Data
 * ```typescript
 * await funProfile.syncData({
 *   mode: 'merge',
 *   data: {
 *     farming_level: 15,
 *     achievements: ['first_harvest']
 *   }
 * });
 * ```
 * 
 * @packageDocumentation
 */

// Core client
export { FunProfileClient } from './FunProfileClient';

// Types
export type {
  FunProfileConfig,
  TokenStorage,
  TokenData,
  FunUser,
  SoulNft,
  UserRewards,
  RegisterOptions,
  SyncOptions,
  AuthResult,
  SyncResult,
  RequestOptions,
  SSOError,
} from './types';

// Errors
export {
  FunProfileError,
  TokenExpiredError,
  InvalidTokenError,
  RateLimitError,
  ValidationError,
  NetworkError,
} from './errors';

// Storage adapters
export {
  LocalStorageAdapter,
  MemoryStorageAdapter,
  SessionStorageAdapter,
} from './storage';

// PKCE utilities
export {
  generateCodeVerifier,
  generateCodeChallenge,
  storeCodeVerifier,
  retrieveCodeVerifier,
} from './pkce';

// Constants
export {
  DEFAULT_BASE_URL,
  ENDPOINTS,
  DEFAULT_SCOPES,
  TOKEN_REFRESH_BUFFER,
  SDK_VERSION,
} from './constants';
