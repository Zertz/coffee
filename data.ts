import { MongoClient } from "mongodb";
import { z } from "zod";

export const ItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  totalPrice: z.number(),
  unitPrice: z.number(),
});

export const OrderSchema = z.object({
  createdAt: z.date(),
  orderedAt: z.string(),
  fromEmail: z.string().email(),
  items: z.array(ItemSchema),
});

export type Item = z.infer<typeof ItemSchema>;
export type Order = z.infer<typeof OrderSchema>;

export async function OrdersCollection() {
  const client = new MongoClient(process.env.MONGO_URI as string);

  await client.connect();

  return client.db("coffee").collection<Order>("orders");
}
