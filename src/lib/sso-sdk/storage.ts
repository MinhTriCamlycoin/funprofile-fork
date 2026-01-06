/**
 * Fun Profile SSO SDK - Token Storage Adapters
 */

import type { TokenData, TokenStorage } from './types';

/**
 * LocalStorage adapter for web browsers
 */
export class LocalStorageAdapter implements TokenStorage {
  private key: string;

  constructor(clientId: string) {
    this.key = `fun_profile_${clientId}`;
  }

  async getTokens(): Promise<TokenData | null> {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async setTokens(tokens: TokenData): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(tokens));
  }

  async clearTokens(): Promise<void> {
    localStorage.removeItem(this.key);
  }
}

/**
 * Memory storage adapter for server-side or testing
 */
export class MemoryStorageAdapter implements TokenStorage {
  private tokens: TokenData | null = null;

  async getTokens(): Promise<TokenData | null> {
    return this.tokens;
  }

  async setTokens(tokens: TokenData): Promise<void> {
    this.tokens = tokens;
  }

  async clearTokens(): Promise<void> {
    this.tokens = null;
  }
}

/**
 * SessionStorage adapter for temporary storage
 */
export class SessionStorageAdapter implements TokenStorage {
  private key: string;

  constructor(clientId: string) {
    this.key = `fun_profile_${clientId}`;
  }

  async getTokens(): Promise<TokenData | null> {
    try {
      const data = sessionStorage.getItem(this.key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async setTokens(tokens: TokenData): Promise<void> {
    sessionStorage.setItem(this.key, JSON.stringify(tokens));
  }

  async clearTokens(): Promise<void> {
    sessionStorage.removeItem(this.key);
  }
}
