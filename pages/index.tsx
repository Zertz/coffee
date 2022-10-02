import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import type { AxisOptions } from "react-charts";
import { orders } from "../data";

type AggregateDocument = {
  _id: string;
  quantity: number;
  totalPrice: number;
  minUnitPrice: number;
  averageUnitPrice: number;
  maxUnitPrice: number;
};

export default function Home({
  data,
}: Awaited<ReturnType<typeof getStaticProps>>["props"]) {
  const primaryAxis = useMemo(
    (): AxisOptions<AggregateDocument> => ({
      getValue: (datum) => datum._id,
    }),
    []
  );

  const secondaryAxes = useMemo(
    (): AxisOptions<AggregateDocument>[] => [
      {
        getValue: (datum) => datum.quantity,
      },
    ],
    []
  );

  const [ReactCharts, setReactCharts] =
    useState<typeof import("react-charts")>();

  useEffect(() => {
    import("react-charts").then(setReactCharts);
  }, []);

  return (
    <main
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <Head>
        <title>Coffee</title>
      </Head>
      {ReactCharts && (
        <ReactCharts.Chart
          options={{
            data,
            primaryAxis,
            secondaryAxes,
          }}
        />
      )}
    </main>
  );
}

export async function getStaticProps() {
  const docs = await (
    await orders()
  )
    .aggregate<AggregateDocument>([
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.name",
          quantity: {
            $sum: "$items.quantity",
          },
          totalPrice: {
            $sum: "$items.totalPrice",
          },
          minUnitPrice: {
            $min: "$items.unitPrice",
          },
          averageUnitPrice: {
            $avg: "$items.unitPrice",
          },
          maxUnitPrice: {
            $max: "$items.unitPrice",
          },
        },
      },
    ])
    .toArray();

  return {
    props: {
      data: [
        {
          label: "Coffee",
          data: docs,
        },
      ],
    },
  };
}
