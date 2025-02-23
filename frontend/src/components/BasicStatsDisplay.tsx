import { useAtomValue } from "jotai";
import { gridIdAtom, gridStatsAtom, usedAnswersAtom } from "../state";
import { roundToNearestNDigits } from "../utils";
import SimpleTextDisplay from "./SimpleTextDisplay";

const BasicStatsDisplay: React.FC = () => {
  const gridId = useAtomValue(gridIdAtom);
  const usedAnswers = useAtomValue(usedAnswersAtom);
  const gridStats = useAtomValue(gridStatsAtom);

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

  const content = (
    <div className="w-full h-full flex flex-col items-center">
      <div className="big-responsive-text">{formatDate(gridId)}</div>
      <br />
      <div className="flex flex-col w-1/2 medium-responsive-text">
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
      </div>
    </div>
  );

  return <SimpleTextDisplay content={content} />;
};

export default BasicStatsDisplay;
