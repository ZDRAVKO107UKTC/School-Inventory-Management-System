/**
 * API Response Types & Utilities
 * Standardized API response contracts with type safety
 */

/**
 * Standardized success response from backend
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

/**
 * Standardized error response from backend
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  statusCode?: number;
  timestamp?: string;
  details?: ValidationError[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Pagination metadata (when present in response)
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Union type for API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type guard to check if response is successful
 */
export const isSuccess = <T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> => {
  return response.success === true;
};

/**
 * Type guard to check if response is an error
 */
export const isError = <T>(response: ApiResponse<T>): response is ApiErrorResponse => {
  return response.success === false;
};

/**
 * Extract error message from response
 */
export const getErrorMessage = (error: ApiErrorResponse): string => {
  if (error.details && error.details.length > 0) {
    return error.details[0].message;
  }
  return error.error || 'An unknown error occurred';
};

/**
 * Extract error details for form field errors
 */
export const getFieldErrors = (error: ApiErrorResponse): Record<string, string> => {
  if (!error.details) {
    return {};
  }

  return error.details.reduce((acc, detail) => {
    acc[detail.field] = detail.message;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Async result wrapper for promise-based API calls
 */
export type AsyncResult<T> = Promise<ApiResponse<T>>;

/**
 * Extract data from successful response (throws on error)
 */
export const unwrapResponse = <T>(response: ApiResponse<T>): T => {
  if (!isSuccess(response)) {
    const message = getErrorMessage(response);
    throw new Error(message);
  }
  return response.data;
};

/**
 * API Call options with retry logic
 */
export interface ApiCallOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Paginated request parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Convert pagination params to query string
 */
export const buildPaginationQuery = (params: PaginationParams): string => {
  const query = new URLSearchParams();
  
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.sort) query.append('sort', params.sort);
  if (params.order) query.append('order', params.order);
  
  return query.toString();
};

/**
 * Extract pagination from response headers
 */
export const getPaginationFromHeaders = (headers: Headers): PaginationMeta | null => {
  const page = headers.get('x-page');
  const limit = headers.get('x-limit');
  const totalItems = headers.get('x-total-count');
  const totalPages = headers.get('x-total-pages');

  if (!page || !limit || !totalItems) {
    return null;
  }

  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalItems: parseInt(totalItems, 10),
    totalPages: parseInt(totalPages, 10),
    hasNextPage: headers.get('x-has-next-page') === 'true',
    hasPreviousPage: headers.get('x-has-prev-page') === 'true',
  };
};
