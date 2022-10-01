import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import { z } from "zod";

type Request = {
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

type Response = {
  name: string;
};

const ItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  totalPrice: z.number(),
  unitPrice: z.number(),
});

const OrderSchema = z.object({
  createdAt: z.date(),
  orderedAt: z.date(),
  fromEmail: z.string().email(),
  items: z.array(ItemSchema),
});

type Item = z.infer<typeof ItemSchema>;
type Order = z.infer<typeof OrderSchema>;

export default async function inbound(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  const { FromFull, TextBody } = req.body as Request;

  if (!TextBody.includes("Nespresso <identification@nespresso.com>")) {
    res.status(400).end();

    return;
  }

  const [, ...orderText] = TextBody.substring(
    TextBody.indexOf("Capsules"),
    Math.min(TextBody.indexOf("Accessories"), TextBody.indexOf("Subtotal"))
  )
    .split("\r\n")
    .filter(Boolean);

  const items: Item[] = [];

  for (let i = 0; i < orderText.length; i += 1) {
    switch (i % 3) {
      case 0: {
        const name = orderText[i];

        items.push({
          name,
          quantity: 0,
          totalPrice: 0,
          unitPrice: 0,
        });

        break;
      }
      case 1: {
        const [quantity, unitPrice] = orderText[i].split(" x $");

        items[items.length - 1] = {
          ...items[items.length - 1],
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
        };

        break;
      }
      case 2: {
        const [, totalPrice] = orderText[i].split("$");

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
    orderedAt: new Date(dateText),
    fromEmail: FromFull.Email,
    items,
  });

  const client = new MongoClient(process.env.MONGO_URI as string);

  await client.connect();

  try {
    await client.db("coffee").collection("orders").insertOne(order);
  } catch (e) {
    // Ignore duplicate key errors
    if (!(e as Error).message.includes("E11000")) {
      throw e;
    }
  }

  res.status(200).end();
}
