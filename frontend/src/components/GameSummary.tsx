import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { gridIdAtom, gridStatsAtom } from "../state";
import { getStatsForGrid } from "../stats";
import SimpleTextDisplay from "./SimpleTextDisplay";

const GameSummary: React.FC = () => {
  const gridId = useAtomValue(gridIdAtom);
  const [gridStats, setGridStats] = useAtom(gridStatsAtom);

  // Whenever we open this component, refresh the stats
  useEffect(() => {
    getStatsForGrid(gridId).then(setGridStats);
  }, [gridId]);

  const content = (
    <div>
      {Object.entries(gridStats).map(([key, stat]) => (
        <div key={key}>
          <strong>{stat.displayName}:</strong> {stat.value}
        </div>
      ))}
    </div>
  );
  return <SimpleTextDisplay content={content} />;
};

export default GameSummary;
