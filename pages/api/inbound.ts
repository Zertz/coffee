import type { NextApiRequest, NextApiResponse } from "next";
import { Item, OrderSchema, OrdersCollection } from "../../data";

type PostmarkInboundEmail = {
  From: string;
  MessageStream: "inbound";
  FromName: string;
  FromFull: {
    Email: string;
    Name: string;
    MailboxHash: string;
  };
  To: string;
  ToFull: {
    Email: string;
    Name: string;
    MailboxHash: string;
  }[];
  Cc: string;
  CcFull: {
    Email: string;
    Name: string;
    MailboxHash: string;
  }[];
  Bcc: string;
  BccFull: {
    Email: string;
    Name: string;
    MailboxHash: string;
  }[];
  OriginalRecipient: string;
  ReplyTo: string;
  Subject: string;
  MessageID: string;
  Date: string;
  MailboxHash: string;
  TextBody: string;
  HtmlBody: string;
  StrippedTextReply: string;
  Tag: string;
  Headers: {
    Name: string;
    Value: string;
  }[];
  Attachments: {
    Name: string;
    Content: string;
    ContentType: string;
    ContentLength: 4096;
    ContentID: string;
  }[];
};

export default async function inbound(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { FromFull, TextBody } = req.body as PostmarkInboundEmail;

  if (!TextBody.includes("Nespresso <identification@nespresso.com>")) {
    res.status(400).end();

    return;
  }

  const capsulesIndex = TextBody.search(/capsules/i);
  const machinesIndex = TextBody.search(/machines/i);
  const accessoriesIndex = TextBody.search(/accessories/i);
  const subtotalIndex = TextBody.search(/subtotal/i);

  const orderText = TextBody.substring(
    capsulesIndex,
    Math.min(
      machinesIndex > capsulesIndex ? machinesIndex : Infinity,
      accessoriesIndex > capsulesIndex ? accessoriesIndex : Infinity,
      subtotalIndex > capsulesIndex ? subtotalIndex : Infinity
    )
  );

  const [, ...orderLines] = orderText.split("\r\n").filter(Boolean);

  const items: Item[] = [];

  for (let i = 0; i < orderLines.length; i += 1) {
    switch (i % 3) {
      case 0: {
        const name = orderLines[i];

        items.push({
          name,
          quantity: 0,
          totalPrice: 0,
          unitPrice: 0,
        });

        break;
      }
      case 1: {
        const [quantity, unitPrice] = orderLines[i].split(" x $");

        items[items.length - 1] = {
          ...items[items.length - 1],
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
        };

        break;
      }
      case 2: {
        const [, totalPrice] = orderLines[i].split("$");

        items[items.length - 1] = {
          ...items[items.length - 1],
          totalPrice: Number(totalPrice),
        };

        break;
      }
    }
  }

  const [, sentLine] = TextBody.substring(
    TextBody.indexOf("<identification@nespresso.com>"),
    TextBody.indexOf("<pierluc@outlook.com>")
  ).split("\r\n");

  const [, dateText] = sentLine.split(" : ");

  const order = OrderSchema.parse({
    createdAt: new Date(),
    orderedAt: dateText,
    fromEmail: FromFull.Email,
    items,
  });

  try {
    await (await OrdersCollection()).insertOne(order);
  } catch (e) {
    // Ignore duplicate key errors
    if (!(e as Error).message.includes("E11000")) {
      throw e;
    }
  }

  res.status(200).end();
}
