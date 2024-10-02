export type ListParams = {
  limit?: number;
  filter?: Record<string, unknown>;
  sort?: string;
  iterator?: boolean;
};

export type CreateParams = {
  [key: string]: unknown;
};

export type UpdateParams = {
  [key: string]: unknown;
};
