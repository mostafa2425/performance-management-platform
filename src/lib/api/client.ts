export type ApiError = {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    const error: ApiError = {
      status: response.status,
      code: payload?.code,
      message: payload?.message ?? response.statusText,
      details: payload?.details
    };
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}