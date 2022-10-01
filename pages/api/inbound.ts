import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

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

export default async function inbound(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  const { FromFull, TextBody } = req.body as Request;

  if (!TextBody.includes("<identification@nespresso.com>")) {
    res.status(400).end();

    return;
  }

  const [, ...order] = TextBody.substring(
    TextBody.indexOf("Capsules"),
    Math.min(TextBody.indexOf("Accessories"), TextBody.indexOf("Subtotal"))
  )
    .split("\r\n")
    .filter(Boolean);

  const items: {
    name: string;
    quantity: number;
    total_price: number;
    unit_price: number;
  }[] = [];

  for (let i = 0; i < order.length; i += 1) {
    switch (i % 3) {
      case 0: {
        const name = order[i];

        items.push({
          name,
          quantity: 0,
          total_price: 0,
          unit_price: 0,
        });

        break;
      }
      case 1: {
        const [quantity, unit_price] = order[i].split(" x $");

        items[items.length - 1] = {
          ...items[items.length - 1],
          quantity: Number(quantity),
          unit_price: Number(unit_price),
        };

        break;
      }
      case 2: {
        const [, total_price] = order[i].split("$");

        items[items.length - 1] = {
          ...items[items.length - 1],
          total_price: Number(total_price),
        };

        break;
      }
    }
  }

  const client = new MongoClient(process.env.MONGO_URI as string);

  await client.connect();

  await client.db("coffee").collection("orders").insertOne({
    createdAt: new Date(),
    from_email: FromFull.Email,
    items,
  });

  res.status(200).end();
}
