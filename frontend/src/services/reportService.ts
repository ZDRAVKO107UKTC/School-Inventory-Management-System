import { apiRequest } from '@/services/apiClient';
import type { ApiResult } from '@/types/auth';

export interface UsageReportItem {
  name: string;
  borrowCount: number;
}

export const getUsageReport = async (token: string): Promise<ApiResult<{ generated_at: string; data: UsageReportItem[] }>> => {
  return apiRequest<{ generated_at: string; data: UsageReportItem[] }>('/reports/usage', { token });
};

export const exportInventoryCSV = async (token: string): Promise<ApiResult<string>> => {
  return apiRequest<string>('/reports/export', { token });
};

export const getFullHistoryReport = async (token: string): Promise<ApiResult<{ generated_at: string; data: any[] }>> => {
  return apiRequest<{ generated_at: string; data: any[] }>('/reports/history', { token });
};

export const downloadHistoryCSV = async (token: string): Promise<void> => {
  const res = await fetch(`/api/reports/export`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.ok) {
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_report_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};

export const resetSystemHistory = async (token: string): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>('/reports/history', { 
    method: 'DELETE',
    token 
  });
};
