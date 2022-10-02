import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import type { AxisOptions } from "react-charts";
import { OrdersCollection } from "../data";

export default function Home({
  data,
}: Awaited<ReturnType<typeof getStaticProps>>["props"]) {
  const primaryAxis = useMemo(
    (): AxisOptions<typeof data[number]["data"][number]> => ({
      getValue: (datum) => datum.name,
    }),
    []
  );

  const secondaryAxes = useMemo(
    (): AxisOptions<typeof data[number]["data"][number]>[] => [
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
      style={{
        backgroundColor: "#262626",
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <Head>
        <title>Coffee</title>
      </Head>
      {ReactCharts && (
        <ReactCharts.Chart
          options={{
            dark: true,
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
    await OrdersCollection()
  )
    .aggregate<{
      _id: string;
      quantity: number;
      totalPrice: number;
      minUnitPrice: number;
      averageUnitPrice: number;
      maxUnitPrice: number;
    }>([
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
      {
        $match: {
          totalPrice: {
            $gt: 0,
          },
        },
      },
      {
        $sort: {
          quantity: 1,
          _id: 1,
        },
      },
    ])
    .toArray();

  return {
    props: {
      data: [
        {
          label: "Coffee",
          data: docs
            .reduce<typeof docs>((acc, doc) => {
              const similar = acc.find(
                ({ _id }) => `Ispirazione ${_id}` === doc._id
              );

              if (similar) {
                return acc
                  .filter(({ _id }) => _id !== similar._id)
                  .concat([
                    {
                      _id: `${doc._id} + ${similar._id}`,
                      quantity: similar.quantity + doc.quantity,
                      totalPrice: similar.totalPrice + doc.totalPrice,
                      minUnitPrice: Math.min(
                        similar.minUnitPrice + doc.minUnitPrice
                      ),
                      averageUnitPrice:
                        (similar.averageUnitPrice + doc.averageUnitPrice) / 2,
                      maxUnitPrice: Math.max(
                        similar.maxUnitPrice + doc.maxUnitPrice
                      ),
                    },
                  ]);
              }

              return acc.concat([doc]);
            }, [])
            .filter(({ averageUnitPrice }) => averageUnitPrice < 2)
            .map(({ _id, ...rest }) => ({
              name: _id,
              ...rest,
            })),
        },
      ],
    },
  };
}
