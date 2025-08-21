import { API_CONFIG, getAppAuthToken } from '../config/api';

export interface RealtimeTokenResponse {
  // The full session JSON from OpenAI Realtime sessions API
  id?: string;
  client_secret?: { value?: string; expires_at?: number };
  [key: string]: any;
}

export async function requestRealtimeToken(customToken?: string): Promise<RealtimeTokenResponse> {
  const url = API_CONFIG.REALTIME.TOKEN_ENDPOINT;
  const appToken = customToken ?? getAppAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (appToken) {
    headers['Authorization'] = `Bearer ${appToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed: ${response.status} ${text}`);
  }

  return response.json();
}

