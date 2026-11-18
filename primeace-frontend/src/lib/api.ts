interface IApiResponse<T, M = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: M;
}

export interface IApiResult<T, M> {
  data: T;
  meta: M;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

function getCsrfToken(): string | null {
  return csrfToken;
}

async function requestApiResponse<T, M = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<IApiResponse<T, M>> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Accept", "application/json");

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const requiresCsrf =
    !["GET", "HEAD", "OPTIONS"].includes(method) &&
    normalizedPath !== "/auth/login" &&
    normalizedPath !== "/auth/csrf";

  if (requiresCsrf && !headers.has("x-csrf-token")) {
    const token = getCsrfToken();

    if (token) {
      headers.set("x-csrf-token", token);
    }
  }

  const response = await fetch(
    `${API_BASE_URL}/api${normalizedPath}`,
    {
      ...options,
      method,
      credentials: "include",
      headers
    }
  );

  const result = await response.json().catch(() => null) as
    | IApiResponse<T, M>
    | null;

  if (!response.ok || !result?.success) {
    throw new ApiError(
      result?.message ?? "Something went wrong. Please try again.",
      response.status
    );
  }

  return result;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const result = await requestApiResponse<T>(path, options);

  return result.data;
}

export async function apiRequestWithMeta<T, M>(
  path: string,
  options: RequestInit = {}
): Promise<IApiResult<T, M>> {
  const result = await requestApiResponse<T, M>(path, options);

  return {
    data: result.data,
    meta: result.meta as M
  };
}
