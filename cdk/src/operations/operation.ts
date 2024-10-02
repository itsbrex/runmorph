import { EntityData } from "../resources";

import { Mapper } from "./mapper";

// type OperationTypes = "list" | "retrieve" | "create" | "update"; // remove as unused

export interface Metadata<S extends Mapper<EntityData, unknown>> {
  schema: S;
  scopes: string[];
}

export interface OperationMetadata<S extends Mapper<EntityData, unknown>> {
  id: string;
  trigger?: string;
  schema: S;
  scopes: string[];
}

export class Operation<S extends Mapper<EntityData, unknown>> {
  protected metadata: OperationMetadata<S>;
  protected schema: S;

  constructor(metadata: OperationMetadata<S>) {
    this.metadata = metadata;
    this.schema = metadata.schema;
  }
}

export const ErrorType = {
  RESOURCE_ALREADY_EXIST: "RESOURCE_ALREADY_EXISTS",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export class Error {
  type: (typeof ErrorType)[keyof typeof ErrorType];
  message?: string;

  static Type = ErrorType;

  constructor(
    type: (typeof ErrorType)[keyof typeof ErrorType],
    message?: string,
  ) {
    this.type = type;
    if (message) {
      this.message = message;
    }
  }
}
