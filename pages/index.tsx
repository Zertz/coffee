import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import type { AxisOptions } from "react-charts";

type DailyStars = {
  date: Date;
  stars: number;
};

type Series = {
  label: string;
  data: DailyStars[];
};

const data: Series[] = [
  {
    label: "React Charts",
    data: [
      {
        date: new Date(),
        stars: 202123,
      },
      // ...
    ],
  },
  {
    label: "React Query",
    data: [
      {
        date: new Date(),
        stars: 10234230,
      },
      // ...
    ],
  },
];

export default function Home() {
  const primaryAxis = useMemo(
    (): AxisOptions<DailyStars> => ({
      getValue: (datum) => datum.date,
    }),
    []
  );

  const secondaryAxes = useMemo(
    (): AxisOptions<DailyStars>[] => [
      {
        getValue: (datum) => datum.stars,
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
