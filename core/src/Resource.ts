import {
  ListParams,
  CreateParams,
  UpdateParams,
  Awaitable,
  EitherDataOrError,
} from "./types";

export class Resource {
  constructor(resourceType: string) {} // eslint-disable-line @typescript-eslint/no-unused-vars

  list(
    params?: ListParams, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): AsyncIterableIterator<unknown> | Awaitable<EitherDataOrError<unknown>> {
    // Implementation

    return { data: {} };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  retrieve(id: string): Awaitable<EitherDataOrError<unknown>> {
    // Implementation
    return { data: {} };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(params: CreateParams): Awaitable<EitherDataOrError<unknown>> {
    // Implementation
    return { data: {} };
  }

  update(
    id: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    params: UpdateParams, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Awaitable<EitherDataOrError<unknown>> {
    // Implementation
    return { data: {} };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delete(id: string): Awaitable<void> {
    // Implementation
  }
}

//const { data, error } = await new Resource("ee").retrieve("ooo");
