export interface ResponseFirebase {
  msg?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  status: number;
  error?: string;
}

export interface ResponseAPI<T = unknown> {
  status: "success" | "error";
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
  error: string | null;
  errors?: Record<string, string>;
}

export interface ResponsePagination<T = unknown> {
  status: "success" | "error";
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
