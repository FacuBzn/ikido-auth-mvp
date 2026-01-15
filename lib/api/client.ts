/**
 * API Client for iKidO
 * Wrapper around fetch with type safety and error handling
 */

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

/**
 * Base API client with error handling
 */
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: {
          code: json.code || "UNKNOWN_ERROR",
          message: json.message || json.error || "An error occurred",
          status: response.status,
        },
      };
    }

    return { data: json as T, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network error",
        status: 0,
      },
    };
  }
}

/**
 * GET request helper
 */
export function apiGet<T>(endpoint: string) {
  return apiClient<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export function apiPost<T, B = unknown>(endpoint: string, body: B) {
  return apiClient<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
