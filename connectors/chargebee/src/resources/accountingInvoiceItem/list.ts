import { List } from "@runmorph/cdk";

import mapper, { type ChargebeeItem, type ChargebeeItemPrice } from "./mapper";

interface ChargebeeItemPriceListResponse {
  list: { item_price: ChargebeeItemPrice }[];
  next_offset?: string;
}

interface ChargebeeItemResponse {
  item: ChargebeeItem;
}

export default new List({
  scopes: [],
  mapper,
  handler: async (connection, { limit, cursor, q }) => {
    const path = "/v2/item_prices";
    const query: Record<string, string> = {};

    // Default limit is 100, max is 100
    const pageSize = Math.min(limit || 100, 100);
    query.limit = pageSize.toString();

    if (cursor) {
      // Decode base64 cursor
      const decodedCursor = Buffer.from(cursor, "base64").toString();
      query.offset = decodedCursor;
    }

    if (q) {
      if (q.type === "text") {
        // Search by name or id
        query["name[starts_with]"] = q.raw;
      }
    }

    // Get item prices
    const { data: priceData, error: priceError } =
      await connection.proxy<ChargebeeItemPriceListResponse>({
        method: "GET",
        path,
        query,
      });

    if (priceError) {
      return { error: priceError };
    }

    // Get unique item IDs
    const uniqueItemIds = [
      ...new Set(priceData.list.map((price) => price.item_price.item_id)),
    ];

    // Get items for unique IDs
    const itemsById = new Map<string, ChargebeeItem>();
    const itemPromises = uniqueItemIds.map(async (itemId) => {
      const { data: itemData, error: itemError } =
        await connection.proxy<ChargebeeItemResponse>({
          method: "GET",
          path: `/v2/items/${itemId}`,
        });

      if (itemError) {
        return { error: itemError };
      }

      itemsById.set(itemId, itemData.item);
      return { error: undefined };
    });

    const itemResults = await Promise.all(itemPromises);

    if (itemResults.some((result) => result.error)) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::BAD_REQUEST",
          message: "Failed to fetch items related to price items",
        },
      };
    }

    // Merge items with prices
    const items = priceData.list.map((price) => ({
      ...price.item_price,
      _item: itemsById.get(price.item_price.item_id)!,
    }));

    // Encode next_offset as base64
    const nextCursor = priceData.next_offset
      ? Buffer.from(priceData.next_offset).toString("base64")
      : null;

    return {
      data: items,
      next: nextCursor,
    };
  },
});
