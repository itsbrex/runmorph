import { EitherDataOrError, List, MorphError } from "@runmorph/cdk";
import mapper, { CalendlySlot } from "./mapper";

interface CalendlyEventType {
  scheduling_url: string;
  created_at: string;
  updated_at: string;
  uri: string;
}

interface CalendlyLookupResponse {
  scheduling_link: {
    uid: string;
  };
  uuid: string;
}

interface CalendlySpot {
  status: "available";
  start_time: string;
  invitees_remaining: number;
}

interface CalendlyDay {
  date: string;
  status: "available" | "unavailable";
  spots: CalendlySpot[];
}

interface CalendlyAvailabilityResponse {
  availability_timezone: string;
  days: CalendlyDay[];
}

export async function listSlots({
  eventTypeId,
  eventTypeData,
  timezone = "UTC",
  cursor,
}: {
  eventTypeId: string;
  eventTypeData: CalendlyEventType;
  timezone: string;
  cursor?: string | null;
}): Promise<
  EitherDataOrError<{
    slots: CalendlySlot[];
    nextCursor: string;
  }>
> {
  // Extract slugs from scheduling URL
  const urlParts = eventTypeData.scheduling_url.split("/");
  const profileSlug = urlParts[urlParts.length - 2];
  const eventTypeSlug = urlParts[urlParts.length - 1];

  // Get scheduling link details
  const lookupResponse = await fetch(
    `https://calendly.com/api/booking/event_types/lookup?event_type_slug=${eventTypeSlug}&profile_slug=${profileSlug}`
  );

  if (!lookupResponse.ok) {
    return {
      error: {
        code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND",
        message: "Failed to lookup event type details",
      },
    };
  }

  const lookupData = (await lookupResponse.json()) as CalendlyLookupResponse;

  // Prepare date range
  const startDate = cursor ? new Date(cursor) : new Date();
  const rangeStart = startDate.toISOString().split("T")[0];
  const lastDay = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    0
  );
  const rangeEnd = lastDay.toISOString().split("T")[0];

  const encodedTimezone = encodeURIComponent(timezone);

  // Get availability
  const availabilityResponse = await fetch(
    `https://calendly.com/api/booking/event_types/${lookupData.uuid}/calendar/range?` +
      `timezone=${encodedTimezone}&diagnostics=false&range_start=${rangeStart}&range_end=${rangeEnd}` +
      `&scheduling_link_uuid=${lookupData.scheduling_link.uid}`
  );

  if (!availabilityResponse.ok) {
    return {
      error: {
        code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND",
        message: "Failed to fetch availability",
      },
    };
  }

  const availabilityData =
    (await availabilityResponse.json()) as CalendlyAvailabilityResponse;

  const slots: CalendlySlot[] = [];

  for (const day of availabilityData.days) {
    if (day.status === "available") {
      for (const spot of day.spots) {
        slots.push({
          event_type_id: eventTypeId,
          availability_timezone: availabilityData.availability_timezone,
          date: day.date,
          status: day.status,
          start_time: spot.start_time,
          invitees_remaining: spot.invitees_remaining,
          created_at: new Date(eventTypeData?.created_at).toISOString(), // Not provided by API
          updated_at: new Date(eventTypeData?.updated_at).toISOString(), // Not provided by API
        });
      }
    }
  }
  // Calculate next month's first day for cursor
  const nextMonth = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + 2,
    1
  );
  const nextCursor = nextMonth.toISOString().split("T")[0];

  return {
    data: {
      slots,
      nextCursor,
    },
  };
}

export default new List({
  mapper,
  scopes: [],
  handler: async (connection, { filters, cursor }) => {
    const eventTypeId =
      filters?.eventType || "969ac615-25f3-40d1-862e-f96e67cc9de4";

    if (!eventTypeId) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::BAD_REQUEST",
          message:
            "Filter Event type ID is required to list Slot : filter[eventType]=id",
        },
      };
    }

    // Get event type details
    const { data: eventTypeDataResult, error: eventTypeError } =
      await connection.proxy<{ resource: CalendlyEventType }>({
        method: "GET",
        path: `/event_types/${eventTypeId}`,
      });

    if (eventTypeError) {
      return { error: eventTypeError };
    }

    const { data, error } = await listSlots({
      eventTypeData: eventTypeDataResult.resource,
      eventTypeId,
      timezone: filters.timezone,
      cursor,
    });

    if (error) {
      return { error };
    }

    return {
      data: data.slots,
      next: data.nextCursor,
    };
  },
});
