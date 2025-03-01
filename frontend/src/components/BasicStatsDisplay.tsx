import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Bar, BarChart, XAxis } from "recharts";
import { gridIdAtom, gridStatsAtom, usedAnswersAtom } from "../state";
import { roundToNearestNDigits } from "../utils";
import SimpleTextDisplay from "./SimpleTextDisplay";
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

        {/* Score bar chart */}
        {scoreCountsList && (
          <ChartContainer config={SCORE_COUNTS_BAR_CHART_CONFIG}>
            <BarChart data={scoreCountsList}>
              <XAxis dataKey="score" tickLine={false} axisLine={false} />
              <Bar dataKey={"count"} fill="#8884d8" radius={12} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );

  return <SimpleTextDisplay content={content} />;
};

export default BasicStatsDisplay;
