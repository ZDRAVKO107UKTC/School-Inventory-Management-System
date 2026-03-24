/**
 * Auth Types & DTOs
 * Frontend contracts aligned with current backend API.
 */

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthSession {
  accessToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface Equipment {
  id: number;
  name: string;
  type: string;
  serial_number: string | null;
  condition: 'new' | 'good' | 'fair' | 'damaged';
  status: 'available' | 'checked_out' | 'under_repair' | 'retired';
  location: string | null;
  photo_url: string | null;
  quantity: number;
  room_id: number | null;
  room?: {
    id: number;
    name: string;
  };
}

export interface BorrowRequest {
  id: number;
  user_id: number;
  equipment_id: number;
  quantity: number;
  request_date: string;
  due_date: string | null;
  return_date: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  notes: string | null;
  approved_by: number | null;
  return_condition?: string | null;
  return_notes?: string | null;
  equipment?: Equipment;
  user?: Pick<User, 'id' | 'username' | 'email'>;
}

export type AuthMode = 'login' | 'signup';
