export interface ResponseFirebase {
  msg?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  status: number;
  error?: string;
}

export interface ResponseAPI<T = unknown> {
  status: number;
  message: string;
  data: T;
  error: string | null;
  errors?: Record<string, string>;
}

export interface ResponsePagination<T = unknown> {
  status: number;
  message: string;
  data: Pagination<T>;
  error: string | null;
}

export interface Pagination<T = unknown> {
  content: T[];
  totalElements: number;
  number: number;
  totalPages: number;
}
