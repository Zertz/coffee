import { Item } from "./data";

export function lineToItems(lines: string[]) {
  const items: Item[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    switch (i % 3) {
      case 0: {
        const name = lines[i];

        items.push({
          name,
          quantity: 0,
          totalPrice: 0,
          unitPrice: 0,
        });

        break;
      }
      case 1: {
        const [quantity, unitPrice] = lines[i].startsWith("$")
          ? lines[i].substring(1).split(" x ").reverse()
          : lines[i].split(" x $");

        items[items.length - 1] = {
          ...items[items.length - 1],
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
        };

        break;
      }
      case 2: {
        const [, totalPrice] = lines[i].split("$");

        items[items.length - 1] = {
          ...items[items.length - 1],
          totalPrice: Number(totalPrice),
        };

        break;
      }
    }
  }

  return items;
}
