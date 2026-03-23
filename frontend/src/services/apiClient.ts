import type { ApiResult } from '@/types/auth';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
}

interface ErrorPayload {
  message?: string;
  error?: string;
  errors?: Array<{
    msg?: string;
    message?: string;
    path?: string;
  }>;
}

const getErrorMessage = (payload: unknown, status: number): string => {
  if (!payload || typeof payload !== 'object') {
    return `Request failed with status ${status}`;
  }

  const errorPayload = payload as ErrorPayload;
  if (typeof errorPayload.message === 'string' && errorPayload.message.trim()) {
    return errorPayload.message;
  }

  if (typeof errorPayload.error === 'string' && errorPayload.error.trim()) {
    return errorPayload.error;
  }

  if (Array.isArray(errorPayload.errors) && errorPayload.errors.length > 0) {
    const firstValidationError = errorPayload.errors.find(
      (entry) =>
        typeof entry?.msg === 'string' && entry.msg.trim()
        || typeof entry?.message === 'string' && entry.message.trim(),
    );

    if (firstValidationError) {
      return firstValidationError.msg || firstValidationError.message || `Request failed with status ${status}`;
    }
  }

  return `Request failed with status ${status}`;
};

const buildUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE.endsWith('/')) {
    return `${API_BASE.slice(0, -1)}${normalizedPath}`;
  }
  return `${API_BASE}${normalizedPath}`;
};

export const buildApiUrl = (path: string): string => buildUrl(path);

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
      return {
        success: false,
        error: getErrorMessage(payload, response.status),
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
