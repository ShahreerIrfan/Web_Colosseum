export interface BaseSuccessResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: MetaData;
}

export interface MetaData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
