import { Retrieve } from "@runmorph/cdk";

import mapper, { type CalendlyEventType } from "./mapper";
import { listSlots } from "../schedulingSlot/list";

export default new Retrieve({
  scopes: [],
  mapper,
  handler: async (connection, { id, fields }) => {
    id = id.startsWith("res_")
      ? Buffer.from(id.slice(4), "base64").toString()
      : id;
    const { data, error } = await connection.proxy<{
      resource: CalendlyEventType;
    }>({
      method: "GET",
      path: `/event_types/${id}`,
    });

    if (error) {
      return { error };
    }
    if (fields?.includes("associated::slots")) {
      if (!data.resource.active) {
        return {
          ...data.resource,
          _slots: [],
        };
      }

      const { data: slotsData, error: slotsError } = await listSlots({
        eventTypeId: id,
        eventTypeData: data.resource,
        timezone: "UTC",
      });

      if (slotsError) {
        return { error: slotsError };
      }

      // If cursor exists, fetch second batch and merge slots
      if (slotsData.nextCursor) {
        const { data: nextSlotsData, error: nextSlotsError } = await listSlots({
          eventTypeId: id,
          eventTypeData: data.resource,
          timezone: "UTC",
          cursor: slotsData.nextCursor,
        });

        if (nextSlotsError) {
          return { error: nextSlotsError };
        }

        return {
          ...data.resource,
          _slots: [...slotsData.slots, ...nextSlotsData.slots],
        };
      }

      return {
        ...data.resource,
        _slots: slotsData.slots,
      };
    }

    return data.resource;
  },
});
