import type { PaginationMeta } from "./commonType.js";

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  code?: string;
  errors?: ApiErrorDetail[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;