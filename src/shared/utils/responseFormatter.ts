export class ResponseFormatter {
    static success<T>(data: T, message?: string) {
        return {
            success: true,
            ...(message && { message }),
            data,
        };
    }

    static error(message: string, errors?: any[]) {
        return {
            success: false,
            message,
            ...(errors && { errors }),
        };
    }

    static paginated<T>(result: PaginationResult<T>) {
        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    }
}