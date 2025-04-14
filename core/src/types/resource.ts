export type ListParams = {
  limit?: number;
  cursor?: string;
  filters?: Record<string, string>;
  sort?: string;
  iterator?: boolean;
  fields?: string[];
  q?: string;
};
