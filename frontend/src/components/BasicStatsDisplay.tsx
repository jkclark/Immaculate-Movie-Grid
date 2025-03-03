import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { gridIdAtom, gridStatsAtom, usedAnswersAtom } from "../state";
import { roundToNearestNDigits } from "../utils";
import SimpleTextDisplay from "./SimpleTextDisplay";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { ChartContainer } from "./ui/chart";

type ScoreCountHistogramDatum = {
  score: number;
  count: number;
};

const BasicStatsDisplay: React.FC = () => {
  const gridId = useAtomValue(gridIdAtom);
  const usedAnswers = useAtomValue(usedAnswersAtom);
  const gridStats = useAtomValue(gridStatsAtom);
  const [scoreCountsList, setScoreCountsList] = useState<ScoreCountHistogramDatum[]>([]);

  /**
   * Convert a string from YYYY-MM-DD to Month Day, Year.
   *
   * @param date A string representing a date in the format "YYYY-MM-DD"
   * @returns A string representing the date in the format "Month Day, Year"
   */
  function formatDate(date: string): string {
    const [year, month, day] = date.split("-");
    const monthName = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleString("default", {
      month: "long",
    });
    return `${monthName} ${parseInt(day)}, ${year}`;
  }

  /**
   * Convert a scoreCounts object into an array of objects, where each object has a "score" key and a "count" key.
   *
   * The output array will have 10 elements, one for each score from 0 to 9.
   *
   * @param scoreCounts an object of scores -> counts
   * @returns an array of objects, where each object has a "score" key (value 0-9) and a "count" key
   */
  function convertScoreCountsToBarChartData(scoreCounts: Record<number, number>): ScoreCountHistogramDatum[] {
    const scoreCountsList = [];
    for (let score = 0; score < 10; score++) {
      const count = scoreCounts[score] || 0;
      scoreCountsList.push({ score, count });
    }

    return scoreCountsList;
  }

  // When the gridStats.scoreCounts changes, update the scoreCountsList
  useEffect(() => {
    if (gridStats.scoreCounts) {
      // For debug
      // setScoreCountsList([
      //   { score: 0, count: 1 },
      //   { score: 1, count: 2 },
      //   { score: 2, count: 30 },
      //   { score: 3, count: 15 },
      //   { score: 4, count: 5 },
      //   { score: 5, count: 6 },
      //   { score: 6, count: 18 },
      //   { score: 7, count: 21 },
      //   { score: 8, count: 7 },
      //   { score: 9, count: 10 },
      // ]);
      setScoreCountsList(convertScoreCountsToBarChartData(gridStats.scoreCounts));
    }
  }, [gridStats.scoreCounts]);

  const SCORE_COUNTS_BAR_CHART_CONFIG = {
    score: {
      label: "Score",
      type: "number",
    },
    count: {
      label: "Count",
      type: "number",
    },
  };

  // Set the Y axis domain to be 10% higher than the highest count
  // so that the highest bar doesn't touch the top of the chart
  // and there's room for the count labels
  const MAX_Y_AXIS_VALUE = Math.max(...scoreCountsList.map((datum) => datum.count)) * 1.1;

  const content = (
    <div className="w-full h-full flex flex-col items-center">
      <div className="big-responsive-text">{formatDate(gridId)}</div>
      <br />
      <div className="flex flex-col w-3/4 medium-responsive-text">
        {/* Your score */}
        <div className="flex justify-between w-full">
          <span>Your Score:</span>
          <span>{Object.keys(usedAnswers).length}</span>
        </div>

        {/* Basic stats */}
        {Object.entries(gridStats.basicStats || {}).map(([key, stat]) => (
          <div className="flex justify-between w-full" key={key}>
            <span>{stat.displayName}:</span>
            <span>{roundToNearestNDigits(stat.value, stat.roundToDigits ?? 0)}</span>
          </div>
        ))}

        <br></br>

        {/* Score bar chart */}
        {scoreCountsList && (
          <Card className="bg-theme-primary border-theme-light-secondary dark:border-theme-dark-secondary">
            <CardHeader>
              <CardTitle className="mx-auto theme-text">Today's scores</CardTitle>
            </CardHeader>
            <ChartContainer config={SCORE_COUNTS_BAR_CHART_CONFIG}>
              <BarChart data={scoreCountsList}>
                <XAxis dataKey="score" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="count"
                  domain={[0, MAX_Y_AXIS_VALUE]}
                  tickLine={false}
                  axisLine={false}
                  hide={true}
                />
                {/* TODO: Make bar width and font size responsive */}
                <Bar
                  dataKey={"count"}
                  className="fill-theme-light-secondary dark:fill-theme-dark-secondary"
                  radius={12}
                  minPointSize={10}
                  barSize={10}
                >
                  <LabelList
                    position="top"
                    className="fill-theme-light-text dark:fill-theme-dark-text"
                    style={{ fontSize: "20px" }}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </Card>
        )}
      </div>
    </div>
  );

  return <SimpleTextDisplay content={content} />;
};

export default BasicStatsDisplay;
