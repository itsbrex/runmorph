import { ResourceRef, EntityData } from "../resources";

/*type PathToRemoteValue<RemoteDataType> = RemoteDataType extends object ? 
    { [K in keyof RemoteDataType]: K extends string | number ? 
        `${K}` | (RemoteDataType[K] extends (infer U)[] ? 
            `${K}` | `${K}.0` | `${K}.0.${PathToRemoteValue<U>}` : 
            (RemoteDataType[K] extends object ? `${K}.${PathToRemoteValue<RemoteDataType[K]>}` : never)
        ) : never 
    }[keyof RemoteDataType] 
    : '';
*/

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type FlattenObjectExtras =
  | undefined
  | null
  | boolean
  | string
  | number
  | bigint
  // | Function // Removed due to eslint warn
  | Date;

type FlattenObjectPaths<T> = T extends FlattenObjectExtras
  ? never
  :
      | {
          [K in keyof T]-?: K extends string | number
            ? T[K] extends Array<infer I>
              ? `${K}` | `${K}.0` | `${K}.0.${FlattenObjectPaths<I>}`
              :
                  | `${K}`
                  | (FlattenObjectPaths<T[K]> extends infer D
                      ? `${K}.${D & string}`
                      : never)
            : never;
        }[keyof T]
      | "*";

type ValueOf<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? ValueOf<T[K], Rest>
    : T extends Array<infer I>
      ? ValueOf<I, Rest>
      : never
  : P extends keyof T
    ? T[P]
    : P extends "*"
      ? DeepPartial<T>
      : T extends Array<infer I>
        ? I
        : never;

type ConstructFlattenedType<T, P extends string = FlattenObjectPaths<T>> = {
  [Path in P]: ValueOf<T, Path>;
};

type ReadValueFunction<RD, EDV, PV> = (path_value: PV, remote_data: RD) => EDV;
type WriteValueFunction<ED, EDV, PV> = (
  entity_data_value: EDV,
  entity_data: ED,
) => PV;

type AttributeConfig<
  RD,
  EDV,
  ED extends EntityData,
  FLDS extends ReadonlyArray<string>,
  FLTR extends string,
  PATH extends keyof ConstructFlattenedType<RD>,
  PV extends ConstructFlattenedType<RD>[PATH],
> = {
  readonly path: PATH;
  readonly read?: ReadValueFunction<RD, EDV, PV>;
  readonly write?: WriteValueFunction<ED, EDV, PV>;
  readonly field?: string;
  readonly fields?: FLDS;
  readonly filter?: FLTR;
};

export class Attribute<
  RD,
  EDV,
  ED extends EntityData,
  FLDS extends ReadonlyArray<string>,
  FLTR extends string,
  P extends keyof ConstructFlattenedType<RD>,
  PV extends ConstructFlattenedType<RD>[P],
> {
  readonly path: P;
  readonly read?: ReadValueFunction<RD, EDV, PV>;
  readonly write?: WriteValueFunction<ED, EDV, PV>;
  readonly field?: string;
  readonly fields?: FLDS;
  readonly filter?: FLTR;

  constructor(private config: AttributeConfig<RD, EDV, ED, FLDS, FLTR, P, PV>) {
    this.path = config.path;
    this.read = config.read;
    this.write = config.write;
    this.field = config.field;
    this.fields = (config.fields || ([] as ReadonlyArray<string>)) as FLDS;
    this.filter = config.filter;
  }

  buildFilter<K extends FLTR>(value: string): { [P in K]: string } {
    if (this.filter) {
      return { [this.filter]: value } as { [P in K]: string };
    }
    return {} as { [P in K]: string };
  }
}

type IdAttributeConfig<
  RD,
  EDV,
  ED extends EntityData,
  FLDS extends ReadonlyArray<string>,
  PATH extends keyof ConstructFlattenedType<RD>,
  PV extends ConstructFlattenedType<RD>[PATH],
> = {
  readonly path: PATH;
  readonly read?: ReadValueFunction<RD, EDV, PV>;
  readonly write?: WriteValueFunction<ED, EDV, PV>;
  readonly field?: string;
  readonly fields?: FLDS;
};

export class IdAttribute<
  RD,
  EDV,
  ED extends EntityData,
  FLDS extends ReadonlyArray<string>,
  P extends keyof ConstructFlattenedType<RD>,
  PV extends ConstructFlattenedType<RD>[P],
> {
  readonly path: P;
  readonly read?: ReadValueFunction<RD, EDV, PV>;
  readonly write?: WriteValueFunction<ED, EDV, PV>;
  readonly field?: string;
  readonly fields?: FLDS;

  constructor(private config: IdAttributeConfig<RD, EDV, ED, FLDS, P, PV>) {
    this.path = config.path;
    this.read = config.read;
    this.write = config.write;
    this.field = config.field;
    this.fields = (config.fields || ([] as ReadonlyArray<string>)) as FLDS;
  }
}

type TimestampAttributeConfig<
  RD,
  EDV,
  // ED extends EntityData, // remove as unused
  FLDS extends ReadonlyArray<string>,
  PATH extends keyof ConstructFlattenedType<RD>,
  PV extends ConstructFlattenedType<RD>[PATH],
> = {
  readonly path: PATH;
  readonly read?: ReadValueFunction<RD, EDV, PV>;
  readonly field?: string;
  readonly fields?: FLDS;
  readonly sort?: {
    asc?: string;
    desc?: string;
  };
};

export class TimestampAttribute<
  RD,
  EDV,
  // ED extends EntityData, // remove as unused
  FLDS extends ReadonlyArray<string>,
  P extends keyof ConstructFlattenedType<RD>,
  PV extends ConstructFlattenedType<RD>[P],
> {
  readonly path: P;
  readonly read?: ReadValueFunction<RD, EDV, PV>;
  readonly field?: string;
  readonly fields?: FLDS;
  readonly sort?: {
    asc?: string;
    desc?: string;
  };

  constructor(private config: TimestampAttributeConfig<RD, EDV, FLDS, P, PV>) {
    this.path = config.path;
    this.read = config.read;
    this.field = config.field;
    this.fields = (config.fields || ([] as ReadonlyArray<string>)) as FLDS;
    this.sort = config.sort;
  }
}

type ResourceConfig<ED extends EntityData, RD> = {
  id: {
    [P in keyof ConstructFlattenedType<RD>]: IdAttributeConfig<
      RD,
      string,
      ED,
      ReadonlyArray<string>,
      P,
      ConstructFlattenedType<RD>[P]
    >;
  }[keyof ConstructFlattenedType<RD>];

  parents?: {
    [P in keyof ConstructFlattenedType<RD>]: IdAttributeConfig<
      RD,
      string,
      ED,
      ReadonlyArray<string>,
      P,
      ConstructFlattenedType<RD>[P]
    >;
  }[keyof ConstructFlattenedType<RD>];

  data?: {
    [K in keyof ED]: ED[K] extends ResourceRef<infer RefED>
      ? ResourceRefConfig<RefED, RD>
      : {
          [P in keyof ConstructFlattenedType<RD>]: AttributeConfig<
            RD,
            NonNullable<ED[K]>,
            ED,
            ReadonlyArray<NonNullable<ED[K]["fields"]>[number]>,
            NonNullable<ED[K]["filter_key"]>,
            P,
            P extends keyof ConstructFlattenedType<RD>
              ? ConstructFlattenedType<RD>[P]
              : never
          >;
        }[keyof ConstructFlattenedType<RD>];
  };

  created_at?: {
    [P in keyof ConstructFlattenedType<RD>]: TimestampAttributeConfig<
      RD,
      Date,
      // ED, // remove as unused
      ReadonlyArray<string>,
      P,
      ConstructFlattenedType<RD>[P]
    >;
  }[keyof ConstructFlattenedType<RD>];

  updated_at?: {
    [P in keyof ConstructFlattenedType<RD>]: TimestampAttributeConfig<
      RD,
      Date,
      // ED, // remove as unused
      ReadonlyArray<string>,
      P,
      ConstructFlattenedType<RD>[P]
    >;
  }[keyof ConstructFlattenedType<RD>];
};

/*type ResourceMapper<
  ED extends EntityData,
  RD,
  RC extends ResourceConfig<ED, RD>,
> = {
  id: IdAttribute<
    RD,
    string,
    ED,
    ReadonlyArray<string>,
    keyof ConstructFlattenedType<RD>,
    ConstructFlattenedType<RD>[keyof ConstructFlattenedType<RD>]
  >;
  parents?: {
    [K in keyof RC["parents"]]: IdAttribute<
      RD,
      string,
      ED,
      ReadonlyArray<string>,
      keyof ConstructFlattenedType<RD>,
      ConstructFlattenedType<RD>[keyof ConstructFlattenedType<RD>]
    >;
  };
  data: {
    [K in keyof RC["data"]]: RC["data"][K] extends ResourceRefConfig<
      infer RefED,
      RD
    >
      ? ResourceRefMapper<RC["data"][K], RefED, RD>
      : RC["data"][K] extends AttributeConfig<
            infer _RD,
            infer _EDV,
            infer _ED,
            infer _T,
            infer _F,
            infer _P,
            infer _PV
          >
        ? Attribute<_RD, _EDV, _ED, _T, _F, _P, _PV>
        : never;
  };
  created_at: TimestampAttribute<
    RD,
    Date,
    ED,
    ReadonlyArray<string>,
    keyof ConstructFlattenedType<RD>,
    ConstructFlattenedType<RD>[keyof ConstructFlattenedType<RD>]
  >;
  updated_at: TimestampAttribute<
    RD,
    Date,
    ED,
    ReadonlyArray<string>,
    keyof ConstructFlattenedType<RD>,
    ConstructFlattenedType<RD>[keyof ConstructFlattenedType<RD>]
  >;
};*/

type ResourceRefConfig<ED extends EntityData, RD> = {
  id: IdAttributeConfig<
    RD,
    string,
    ED,
    ReadonlyArray<string>,
    keyof ConstructFlattenedType<RD>,
    ConstructFlattenedType<RD>[keyof ConstructFlattenedType<RD>]
  >;
  parents?: {
    [key: string]: IdAttributeConfig<
      RD,
      string,
      ED,
      ReadonlyArray<string>,
      keyof ConstructFlattenedType<RD>,
      ConstructFlattenedType<RD>[keyof ConstructFlattenedType<RD>]
    >;
  };
};
/*type ResourceRefMapper<
  RRC extends ResourceRefConfig<ED, RD>,
  ED extends EntityData,
  RD,
> = {
  id: IdAttribute<
    RD,
    string,
    ED,
    ReadonlyArray<string>,
    keyof ConstructFlattenedType<RD>,
    ConstructFlattenedType<RD>[keyof ConstructFlattenedType<RD>]
  >;
  parents?: {
    [K in keyof RRC["parents"]]: IdAttribute<
      RD,
      string,
      ED,
      ReadonlyArray<string>,
      keyof ConstructFlattenedType<RD>,
      ConstructFlattenedType<RD>[keyof ConstructFlattenedType<RD>]
    >;
  };
};*/

export class Mapper<ED extends EntityData, RD> {
  private schema: ResourceConfig<ED, RD>;

  constructor(schema: ResourceConfig<ED, RD>) {
    this.schema = schema;
  }
}
