import { Retrieve } from "@runmorph/cdk";

import mapper, { type ChargebeeItem, type ChargebeeItemPrice } from "./mapper";

interface ChargebeeItemPriceResponse {
  item_price: ChargebeeItemPrice;
}

interface ChargebeeItemResponse {
  item: ChargebeeItem;
}

export default new Retrieve({
  scopes: [],
  mapper,
  handler: async (connection, { id }) => {
    // Get item price
    const { data: priceData, error: priceError } =
      await connection.proxy<ChargebeeItemPriceResponse>({
        method: "GET",
        path: `/v2/item_prices/${id}`,
      });

    if (priceError) {
      return { error: priceError };
    }

    // Get associated item
    const { data: itemData, error: itemError } =
      await connection.proxy<ChargebeeItemResponse>({
        method: "GET",
        path: `/v2/items/${priceData.item_price.item_id}`,
      });

    if (itemError) {
      return { error: itemError };
    }

    // Merge item with price
    return {
      ...priceData.item_price,
      _item: itemData.item,
    };
  },
});
