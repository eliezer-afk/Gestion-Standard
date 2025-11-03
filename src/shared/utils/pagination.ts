export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

export interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export const parsePagination = (query: any): PaginationParams => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

export const createPaginationResult = <T>(
    data: T[],
    total: number,
    params: PaginationParams
): PaginationResult<T> => {
    const totalPages = Math.ceil(total / params.limit);

    return {
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages,
            hasNext: params.page < totalPages,
            hasPrev: params.page > 1,
        },
    };
};