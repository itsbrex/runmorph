export type AttioAttributeValue<
  T extends Record<string, unknown> | undefined = undefined,
> = Array<
  {
    attribute_type: string;
    active_from: string;
    active_until: string | null;
    created_by_actor: {
      type: string;
      id: string | null;
    };
  } & (T extends Record<string, unknown> ? T : { value: string })
>;
