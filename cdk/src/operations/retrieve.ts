import { EntityData } from "../resources";

import { Mapper } from "./mapper";
import { Operation } from "./operation";

type Input = {
  id: string;
  parents?: {
    [key: string]: string;
  };
  fields: string[];
};

/*type Output<S extends Mapper<any, any>> =
  S extends Mapper<infer ED, any> ? Resource<ED> : never;*/ // remove as unused

type EitherOr<T extends object[]> = {
  [K in keyof T]: {
    [P in keyof T[K]]: T[K][P];
  } & {
    [P in Exclude<keyof UnionToIntersection<T[number]>, keyof T[K]>]?: never;
  };
}[number];
type EitherDataOrError<DataType> = EitherOr<
  [{ data: DataType }, { error: Error }]
>;

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type HandlerOutput<S extends Mapper<EntityData, unknown>> =
  S extends Mapper<EntityData, infer R> ? R : never;

type ConnectionProxyParams = {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
};
type RuntimeConnection = {
  proxy: (params: ConnectionProxyParams) => Promise<EitherDataOrError<unknown>>;
};

export type RetrieveConfig<S extends Mapper<EntityData, unknown>> = {
  handler: (
    connection: RuntimeConnection,
    data: Input,
  ) => Promise<HandlerOutput<S>>;
  schema: S;
  scopes: string[];
};
export class Retrieve<
  S extends Mapper<EntityData, unknown>,
> extends Operation<S> {
  private handler: (
    connection: RuntimeConnection,
    data: Input,
  ) => Promise<HandlerOutput<S>>;

  constructor({
    handler,
    schema,
    scopes,
  }: {
    handler: (
      connection: RuntimeConnection,
      data: Input,
    ) => Promise<HandlerOutput<S>>;
    schema: S;
    scopes: string[];
  }) {
    super({
      id: "retrieve",
      schema: schema,
      scopes: scopes || [],
    });
    this.handler = handler;
  }

  /* async run(
    runtime: MorphClient<any, any, any>,
    data: Input<S>
  ): Promise<Output<S> | Error> {
    try {
      const output: HandlerOutput<S> = await this.handler(runtime, data);
      const mapped_resource =
        this.metadata.schema.fromRemoteDataToResourceEntityData(output);

      // Utilisez une assertion de type pour assurer TypeScript que mapped_resource est de type Output<S>
      return mapped_resource as Output<S>;
    } catch (error) {
      // If an error is thrown, catch it and return as an Error object
      return error instanceof Error
        ? error
        : new Error(ErrorType.UNKNOWN_ERROR, String(error));
    }
  }*/
}
