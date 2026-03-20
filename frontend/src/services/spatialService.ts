import { apiRequest } from '@/services/apiClient';
import type { ApiResult } from '@/types/auth';

export interface Room {
  id: number;
  floor_id: number;
  name: string;
  path_data: string | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

export interface Floor {
  id: number;
  name: string;
  level: number;
  rooms: Room[];
}

export const getFloors = async (token: string): Promise<ApiResult<{ floors: Floor[] }>> => {
  return apiRequest<{ floors: Floor[] }>('/spatial/floors', {
    method: 'GET',
    token,
  });
};

export const createFloor = async (token: string, data: { name: string; level: number }): Promise<ApiResult<{ floor: Floor }>> => {
  return apiRequest<{ floor: Floor }>('/spatial/floors', {
    method: 'POST',
    token,
    body: data,
  });
};

export const updateFloor = async (token: string, floorId: number, data: { name?: string; level?: number }): Promise<ApiResult<{ floor: Floor }>> => {
  return apiRequest<{ floor: Floor }>(`/spatial/floors/${floorId}`, {
    method: 'PUT',
    token,
    body: data,
  });
};

export const createRoom = async (token: string, data: Partial<Room>): Promise<ApiResult<{ room: Room }>> => {
  return apiRequest<{ room: Room }>('/spatial/rooms', {
    method: 'POST',
    token,
    body: data,
  });
};

export const updateRoom = async (token: string, roomId: number, data: Partial<Room>): Promise<ApiResult<{ room: Room }>> => {
  return apiRequest<{ room: Room }>(`/spatial/rooms/${roomId}`, {
    method: 'PUT',
    token,
    body: data,
  });
};

export const deleteRoom = async (token: string, roomId: number): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>(`/spatial/rooms/${roomId}`, {
    method: 'DELETE',
    token,
  });
};

export const deleteFloor = async (token: string, floorId: number): Promise<ApiResult<{ message: string }>> => {
  return apiRequest<{ message: string }>(`/spatial/floors/${floorId}`, {
    method: 'DELETE',
    token,
  });
};

export const assignEquipmentToRoom = async (token: string, equipment_id: number, room_id: number | null): Promise<ApiResult<{ equipment: any }>> => {
  return apiRequest<{ equipment: any }>('/spatial/assign', {
    method: 'POST',
    token,
    body: { equipment_id, room_id },
  });
};
