import api from '@/apis/axios';
import type { RbacItem } from '@/types/api/authTypes';
import type { BaseSuccessResponse } from '@/types/api/CommonTypes';

export interface ManagedRole {
  id: string;
  name: string;
  builtIn: boolean;
  permissions: RbacItem[];
}

export const roleApi = {
  async list() {
    const { data } = await api.get<BaseSuccessResponse<ManagedRole[]>>('/roles');
    return data.data;
  },
  async save(values: { name: string; permissions: RbacItem[] }, id?: string) {
    const response = id
      ? await api.put<BaseSuccessResponse<ManagedRole>>(`/roles/${id}`, values)
      : await api.post<BaseSuccessResponse<ManagedRole>>('/roles', values);
    return response.data.data;
  },
  async remove(id: string) {
    await api.delete(`/roles/${id}`);
  },
};
