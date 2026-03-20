import type { ApiResult } from '@/types/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
}

interface ErrorPayload {
  message?: string;
  error?: string;
}

const buildUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE.endsWith('/')) {
    return `${API_BASE.slice(0, -1)}${normalizedPath}`;
  }
  return `${API_BASE}${normalizedPath}`;
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(buildUrl(path), {
      method: options.method || 'GET',
      headers,
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('sims_auth_session');
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth?expired=true';
        }
      }
      const errorPayload = payload as ErrorPayload;
      return {
        success: false,
        error: errorPayload.message || errorPayload.error || `Request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      data: payload as T,
      message: (payload.message as string | undefined) || 'Success',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network request failed',
    };
  }
};
