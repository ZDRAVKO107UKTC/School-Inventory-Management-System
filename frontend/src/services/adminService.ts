import { apiRequest } from '@/services/apiClient';
import type { ApiResult, User, UserRole } from '@/types/auth';

export interface AdminDashboardPayload {
  message: string;
  user: {
    userId: number;
    role: UserRole;
    email: string;
  };
}

export interface AdminCreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AdminCreateEquipmentPayload {
  name: string;
  type: string;
  condition: 'new' | 'good' | 'fair' | 'damaged';
  quantity: number;
  serial_number?: string;
  location?: string;
  photo_url?: string;
}

export const getAdminDashboard = async (token: string): Promise<ApiResult<AdminDashboardPayload>> => {
  return apiRequest<AdminDashboardPayload>('/admin/dashboard', {
    method: 'GET',
    token,
  });
};

export const getUsersAsAdmin = async (token: string): Promise<ApiResult<{ users: User[] }>> => {
  return apiRequest<{ users: User[] }>('/admin/users', {
    method: 'GET',
    token,
  });
};

export const createUserAsAdmin = async (
  token: string,
  payload: AdminCreateUserPayload,
): Promise<ApiResult<{ message: string; user: User }>> => {
  return apiRequest<{ message: string; user: User }>('/admin/users', {
    method: 'POST',
    token,
    body: payload,
  });
};

export const updateUserRoleAsAdmin = async (
  token: string,
  userId: number,
  role: UserRole,
): Promise<ApiResult<{ message: string; user: Pick<User, 'id' | 'username' | 'role'> }>> => {
  return apiRequest<{ message: string; user: Pick<User, 'id' | 'username' | 'role'> }>(`/admin/users/${userId}/role`, {
    method: 'PUT',
    token,
    body: { role },
  });
};

export const deleteUserAsAdmin = async (token: string, userId: number): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>(`/admin/users/${userId}`, {
    method: 'DELETE',
    token,
  });
};

export const updateUserAsAdmin = async (
  token: string,
  userId: number,
  payload: Partial<AdminCreateUserPayload>,
): Promise<ApiResult<{ message: string; user: User }>> => {
  return apiRequest<{ message: string; user: User }>(`/admin/users/${userId}`, {
    method: 'PUT',
    token,
    body: payload,
  });
};

export const createEquipmentAsAdmin = async (
  token: string,
  payload: AdminCreateEquipmentPayload,
): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>('/equipment', {
    method: 'POST',
    token,
    body: payload,
  });
};

export const deleteEquipmentAsAdmin = async (token: string, equipmentId: number): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>(`/equipment/${equipmentId}`, {
    method: 'DELETE',
    token,
  });
};

export const approveRequestAsAdmin = async (token: string, requestId: number): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>(`/request/${requestId}/approve`, {
    method: 'PUT',
    token,
    body: {},
  });
};

export const rejectRequestAsAdmin = async (
  token: string,
  requestId: number,
  reason?: string,
): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>(`/request/${requestId}/reject`, {
    method: 'PUT',
    token,
    body: { reason },
  });
};

export const getRequestsAsAdmin = async (token: string): Promise<ApiResult<{ requests: any[] }>> => {
  return apiRequest<{ requests: any[] }>('/request', {
    method: 'GET',
    token,
  });
};

export const deleteRequestAsAdmin = async (token: string, requestId: number): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>(`/request/${requestId}`, {
    method: 'DELETE',
    token,
  });
};

export const returnRequestAsAdmin = async (
  token: string,
  requestId: number,
  condition: 'new' | 'good' | 'fair' | 'damaged',
  notes?: string,
): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>(`/request/${requestId}/return`, {
    method: 'PUT',
    token,
    body: { condition, notes },
  });
};

export const updateEquipmentAsAdmin = async (
  token: string,
  equipmentId: number,
  payload: Partial<AdminCreateEquipmentPayload>,
): Promise<ApiResult<{ message: string; equipment: any }>> => {
  return apiRequest<{ message: string; equipment: any }>(`/equipment/${equipmentId}`, {
    method: 'PUT',
    token,
    body: payload,
  });
};

export const getAdminEquipmentHistory = async (token: string, id: number): Promise<ApiResult<any>> => {
  return apiRequest<any>(`/request/history/equipment/${id}`, { method: 'GET', token });
};

export const getAdminUserHistory = async (token: string, id: number): Promise<ApiResult<any>> => {
  return apiRequest<any>(`/request/history/users/${id}`, { method: 'GET', token });
};
