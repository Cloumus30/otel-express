import api from './api';
import type { User, ApiResponse, CreateUserInput, UpdateUserInput } from '../types/user';

export const userService = {
  // Get all users
  async getAll(): Promise<User[]> {
    const res = await api.get<ApiResponse<User[]>>('/users');
    return res.data.data || [];
  },

  // Get user by id
  async getById(id: string): Promise<User> {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    if (!res.data.data) {
      throw new Error(res.data.message || 'User tidak ditemukan');
    }
    return res.data.data;
  },

  // Create user
  async create(data: CreateUserInput): Promise<User> {
    const res = await api.post<ApiResponse<User>>('/users', data);
    if (!res.data.data) {
      throw new Error(res.data.message || 'Gagal menambahkan user');
    }
    return res.data.data;
  },

  // Update user
  async update(id: string, data: UpdateUserInput): Promise<User> {
    const res = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    if (!res.data.data) {
      throw new Error(res.data.message || 'Gagal mengupdate user');
    }
    return res.data.data;
  },

  // Delete user
  async delete(id: string): Promise<void> {
    await api.delete<ApiResponse>(`/users/${id}`);
  },
};
