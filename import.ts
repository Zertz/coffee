import { OrdersCollection } from "./data";
import { lineToItems } from "./lineToItems";

// Copy one or more orders from https://www.nespresso.com/ca/en/myaccount/orders/list
const orders = `Order #74186905 - 17/05/2020
ArticleORIGINAL CAPSULES(150)	Unit price		Quantity	Total
	Best Sellers 50 Original Capsules	$38.80	x	1	$38.80
Firenze Arpeggio Decaffeinato Original Coffee Capsule	Firenze Arpeggio Decaffeinato	$0.82	x	20	$16.40
Caramel Crème Brûlée Original Coffee Capsule	Caramel Crème Brûlée	$0.86	x	20	$17.20
Napoli Original Coffee Capsule	Ispirazione Napoli	$0.78	x	40	$31.20
Ristretto Italiano Decaffeinato Original Coffee Capsule	Ristretto Decaffeinato	$0.82	x	20	$16.40
Order #71909282 - 18/03/2020
ArticleORIGINAL CAPSULES(100)	Unit price		Quantity	Total
Roma Original Coffee Capsule	Roma	$0.78	x	40	$31.20
	Caramelito	$0.86	x	20	$17.20
Napoli Original Coffee Capsule	Ispirazione Napoli	$0.78	x	20	$15.60
Venezia Original Coffee Capsule	Ispirazione Venezia	$0.78	x	20	$15.60`
  .replace(/\t\t/g, "\t")
  .replace(/\tx\t/g, " x ")
  .split(/Order /)
  .filter(Boolean)
  .map((order) =>
    order
      .split(/\n/)
      .filter(Boolean)
      .map((order) => order.split(/\t/))
  );

const docs = orders.map(([[orderNumber], header, ...order]) => {
  const items = order
    .map((item) => item.slice(1))
    .flatMap((line) => lineToItems(line));

  const doc = {
    createdAt: new Date(),
    orderedAt: orderNumber,
    fromEmail: "",
    items,
  };

  return doc;
});

(async () => {
  await (await OrdersCollection()).insertMany(docs);

  process.exit(0);
})();
