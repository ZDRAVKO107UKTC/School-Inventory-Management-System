import { apiRequest } from '@/services/apiClient';
import type { ApiResult, BorrowRequest } from '@/types/auth';

export interface SubmitRequestPayload {
  equipment_id: number;
  request_date: string;
  due_date: string;
  notes?: string;
}

export interface ReturnRequestPayload {
  condition?: 'new' | 'good' | 'fair' | 'damaged';
  notes?: string;
}

export const submitBorrowRequest = async (
  token: string,
  payload: SubmitRequestPayload,
): Promise<ApiResult<BorrowRequest>> => {
  return apiRequest<BorrowRequest>('/request', {
    method: 'POST',
    token,
    body: payload,
  });
};

export const getMyRequests = async (token: string): Promise<ApiResult<BorrowRequest[]>> => {
  return apiRequest<BorrowRequest[]>('/request/my', {
    method: 'GET',
    token,
  });
};

export const returnBorrowRequest = async (
  token: string,
  requestId: number,
  payload: ReturnRequestPayload,
): Promise<ApiResult<BorrowRequest>> => {
  const result = await apiRequest<{ request: BorrowRequest; message?: string }>(`/request/${requestId}/return`, {
    method: 'PUT',
    token,
    body: payload,
  });

  if (!result.success || !result.data) return { success: false, error: result.error };

  return {
    success: true,
    data: result.data.request,
    message: result.data.message,
  };
};

export const deleteBorrowRequest = async (
  token: string,
  requestId: number,
): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>(`/request/${requestId}`, {
    method: 'DELETE',
    token,
  });
};

export const getAllRequestsAdmin = async (token: string): Promise<ApiResult<{ requests: BorrowRequest[] }>> => {
  return apiRequest<{ requests: BorrowRequest[] }>('/request', {
    method: 'GET',
    token,
  });
};

export const approveRequest = async (token: string, requestId: number): Promise<ApiResult<{ message: string; request: BorrowRequest }>> => {
  return apiRequest<{ message: string; request: BorrowRequest }>(`/request/${requestId}/approve`, {
    method: 'PUT',
    token,
  });
};

export const rejectRequest = async (token: string, requestId: number, reason?: string): Promise<ApiResult<{ message: string; request: BorrowRequest }>> => {
  return apiRequest<{ message: string; request: BorrowRequest }>(`/request/${requestId}/reject`, {
    method: 'PUT',
    token,
    body: { reason },
  });
};
