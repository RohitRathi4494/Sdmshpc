export class ApiError extends Error {
    public statusCode: number;
    public errorCode: string;
    public details?: any; // To hold validation errors or extra data

    constructor(statusCode: number, errorCode: string, message: string, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.name = 'ApiError';
    }
}

export function handleApiError(error: unknown) {
    if (error instanceof ApiError) {
        return {
            success: false,
            error_code: error.errorCode,
            message: error.message,
        };
    }

    console.error('Unhandled API Error:', error);
    return {
        success: false,
        error_code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.',
    };
}
