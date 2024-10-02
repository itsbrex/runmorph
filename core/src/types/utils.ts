import { MorphError } from "./../Error";

export type Awaitable<T> = T | PromiseLike<T>;
export type EitherDataOrError<DataType> = EitherOr<
  [{ data: DataType }, { error: MorphError }]
>;
export type EitherOr<T extends object[]> = {
  [K in keyof T]: {
    [P in keyof T[K]]: T[K][P];
  } & {
    [P in Exclude<keyof UnionToIntersection<T[number]>, keyof T[K]>]?: never;
  };
}[number];

export type ErrorOrVoid = { error?: MorphError };

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;
