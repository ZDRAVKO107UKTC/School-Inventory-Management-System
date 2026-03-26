import { apiRequest } from '@/services/apiClient';
import type { ApiResult } from '@/types/auth';

export interface GlobalDocument {
  id: number;
  name: string;
  category: string;
  url: string;
  format: string;
  size: string;
  uploaded_by: number;
  createdAt: string;
  updatedAt: string;
}

export const getAllDocuments = async (token: string, category?: string): Promise<ApiResult<GlobalDocument[]>> => {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiRequest<GlobalDocument[]>(`/admin/documents${query}`, { token });
};

export const uploadGlobalDocument = async (token: string, file: File, name?: string, category?: string): Promise<ApiResult<GlobalDocument>> => {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);
  if (category) formData.append('category', category);

  // Use a relative URL so the request routes through the Vite proxy (avoids CORS)
  try {
    const res = await fetch(`/api/admin/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || data.message || 'Upload failed' };
    }
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteDocument = async (token: string, id: number): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>(`/admin/documents/${id}`, {
    method: 'DELETE',
    token
  });
};
