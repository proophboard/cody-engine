import { UseQueryResult } from '@tanstack/react-query';
export type Pagination = { limit?: number; skip?: number };
export type PaginationInfo = {
  limit: number;
  skip: number;
  total: number;
};
export interface PaginationResponse<T = any> {
  items: T;
  limit: number;
  skip: number;
  total: number;
  paginated: boolean;
}

export const queryPaginationInfo = (
  query: UseQueryResult
): PaginationInfo | undefined => {
  if (query.isSuccess) {
    const { data } = query;

    const objectSymbols = Object.getOwnPropertySymbols(data);

    for (const s of objectSymbols) {
      if (s.toString() === 'Symbol(paginationInfo)') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return data[s];
      }
    }
  }

  return;
};
