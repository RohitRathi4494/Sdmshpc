import { ApiError } from './api-error';

const API_BASE = '/api';

type RequestOptions = RequestInit & {
    token?: string;
};

export class ApiClient {
    public static async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { token, headers, ...rest } = options;

        const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const config: RequestInit = {
            ...rest,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...headers,
            },
        };

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new ApiError(
                    response.status,
                    data.error_code || 'UNKNOWN_ERROR',
                    data.message || 'An unexpected error occurred',
                    data // Pass the full response data as details
                );
            }

            return data.data as T;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, 'NETWORK_ERROR', (error as Error).message);
        }
    }

    public static async get<T>(endpoint: string, token?: string) {
        return this.request<T>(endpoint, { method: 'GET', token });
    }

    public static async post<T>(endpoint: string, body: any, token?: string) {
        return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), token });
    }

    public static async put<T>(endpoint: string, body: any, token?: string) {
        return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), token });
    }

    public static async patch<T>(endpoint: string, body: any, token?: string) {
        return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), token });
    }
}
