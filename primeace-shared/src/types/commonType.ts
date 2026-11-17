export type ID = string;

export type ISODateString = string;

export type MoneyKobo = number;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type SortOrder = "asc" | "desc";
