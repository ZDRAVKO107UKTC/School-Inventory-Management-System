import { apiRequest } from '@/services/apiClient';
import type { ApiResult, Equipment } from '@/types/auth';

export interface EquipmentFilters {
  search?: string;
  type?: string;
  status?: string;
}

const buildQuery = (filters: EquipmentFilters): string => {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const getEquipmentList = async (filters: EquipmentFilters = {}): Promise<ApiResult<Equipment[]>> => {
  return apiRequest<Equipment[]>(`/equipment${buildQuery(filters)}`);
};

export const getEquipmentDetails = async (id: number): Promise<ApiResult<Equipment>> => {
  return apiRequest<Equipment>(`/equipment/${id}`);
};

export const createEquipment = async (
  token: string,
  data: Pick<Equipment, 'name' | 'type' | 'condition' | 'quantity'> & Partial<Pick<Equipment, 'serial_number' | 'location' | 'photo_url'>>,
): Promise<ApiResult<Equipment>> => {
  const result = await apiRequest<{ equipment: Equipment; message?: string }>('/equipment', {
    method: 'POST',
    token,
    body: data,
  });

  if (!result.success || !result.data) return { success: false, error: result.error };

  return {
    success: true,
    data: result.data.equipment,
    message: result.data.message,
  };
};

export const updateEquipmentStatus = async (
  token: string,
  id: number,
  status: 'available' | 'checked_out' | 'under_repair' | 'retired',
): Promise<ApiResult<Equipment>> => {
  return apiRequest<Equipment>(`/equipment/${id}/status`, {
    method: 'PUT',
    token,
    body: { status },
  });
};
export const getConditionHistory = async (token: string, equipmentId: number): Promise<ApiResult<any[]>> => {
  return apiRequest<any[]>(`/equipment/${equipmentId}/condition-history`, {
    method: 'GET',
    token,
  });
};
