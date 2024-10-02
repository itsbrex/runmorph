export type EntityData = {
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type Raw<T extends Entity> = Pick<T, Exclude<keyof T, keyof Entity>>;
export type ModelConfig = {
  id: string;
  parents?: {
    [key: string]: string;
  };
};

export class Entity implements EntityData {
  static id: string;
  static parents: {
    [key: string]: string;
  };

  constructor(model_data: ModelConfig) {
    Entity.id = model_data.id;
    Entity.parents = model_data.parents || {};
  }

  getModelId(): string {
    return Entity.id;
  }
}

export class ResourceRef<ED extends EntityData> {
  object?: string = "resource_ref";
  model?: string;
  id: string;
  parents?: {
    [key: string]: string;
  };

  constructor({ id, parents }: ResourceRef<ED>, model: new (data?: ED) => ED) {
    this.id = id;
    this.model = new model().getModelId();
    if (parents) {
      this.parents = parents;
    }
  }
}

export class ResourceEvent<M extends Entity> extends ResourceRef<M> {
  object?: string = "resource_event";
  model?: string;
  id: string;
  parents?: {
    [key: string]: string;
  };
  trigger?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;

  constructor(
    {
      id,
      parents,
      trigger,
      created_at,
      updated_at,
      deleted_at,
    }: ResourceEvent<M>,
    model: new (data?: Raw<M>) => M,
  ) {
    super({ id, parents }, model);
    this.id = id;
    this.model = new model().getModelId();

    if (trigger) {
      this.trigger = trigger;
    }

    if (created_at) {
      this.created_at = created_at;
    }

    if (updated_at) {
      this.updated_at = updated_at;
    }

    if (deleted_at) {
      this.deleted_at = deleted_at;
    }
  }
}

export class Resource<ED extends EntityData> extends ResourceRef<ED> {
  id: string;
  parents?: {
    [key: string]: string;
  };
  object?: string = "resource";
  model?: string;
  data: ED;
  remote_data: unknown;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;

  constructor(
    {
      id,
      parents,
      data,
      remote_data,
      created_at,
      updated_at,
      deleted_at,
    }: Resource<ED>,
    model: new (data?: ED) => ED,
  ) {
    super({ id, parents }, model);
    this.id = id;
    this.model = new model().getModelId();

    this.data = new model(data);
    this.remote_data = remote_data;

    if (created_at) {
      this.created_at = created_at;
    }

    if (updated_at) {
      this.updated_at = updated_at;
    }

    if (deleted_at) {
      this.deleted_at = deleted_at;
    }
  }
}
