import type { NextApiRequest, NextApiResponse } from "next";

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

export default (req: NextApiRequest, res: NextApiResponse<Response>) => {
  const { TextBody } = req.body as Request;

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

  console.info(order);

  res.status(200).end();
};
