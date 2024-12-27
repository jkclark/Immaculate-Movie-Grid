import { ActorExport, CategoryExport, CreditExport } from "common/src/interfaces";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";

import { AnyGridDisplayData, TextGridDisplayData } from "../gridDisplayData";
import { gridDataAtom, gridIdAtom, gridStatsAtom } from "../state";
import { getStatsForGrid } from "../stats";
import CorrectCreditsSummary from "./CorrectCreditsSummary";
import Grid from "./Grid";
import { useOverlayStack } from "./Overlay";

const GameSummary: React.FC = () => {
  const gridId = useAtomValue(gridIdAtom);
  const gridData = useAtomValue(gridDataAtom);
  const { addContentsToOverlay } = useOverlayStack();
  const [gridStats, setGridStats] = useAtom(gridStatsAtom);

  // Whenever we open this component, refresh the stats
  useEffect(() => {
    getStatsForGrid(gridId).then(setGridStats);
  }, [gridId]);

  function getAllAnswerGridDisplayData(): AnyGridDisplayData[][] {
    const newInnerGridData: TextGridDisplayData[][] = [];
    const acrossAxisEntities = gridData.axes.slice(0, gridData.axes.length / 2);
    const downAxisEntities = gridData.axes.slice(gridData.axes.length / 2);
    for (const downAxisEntityString of downAxisEntities) {
      const innerGridRow: TextGridDisplayData[] = [];
      for (const acrossAxisEntityString of acrossAxisEntities) {
        const [acrossAxisEntityType, acrossAxisEntityId] = acrossAxisEntityString.split("-");
        const acrossAxisEntity =
          acrossAxisEntityType === "actor"
            ? getAxisEntityFromListById(gridData.actors, parseInt(acrossAxisEntityId))
            : getAxisEntityFromListById(gridData.categories, -1 * parseInt(acrossAxisEntityId));

        const [downAxisEntityType, downAxisEntityId] = downAxisEntityString.split("-");
        const downAxisEntity =
          downAxisEntityType === "actor"
            ? getAxisEntityFromListById(gridData.actors, parseInt(downAxisEntityId))
            : getAxisEntityFromListById(gridData.categories, -1 * parseInt(downAxisEntityId));

        const answers = getAnswersForPair(acrossAxisEntity.id, downAxisEntity.id);
        const answerText = `${answers.length}`;
        innerGridRow.push({
          mainText: answerText,
          clickHandler: () => {
            addContentsToOverlay(<CorrectCreditsSummary credits={answers} />);
          },
        });
      }
      newInnerGridData.push(innerGridRow);
    }

    return newInnerGridData;
  }

  // TODO: This is copy-pasted from another file. Also we should just refactor the gridExport to be
  // objects not lists
  function getAxisEntityFromListById(
    axisEntities: (ActorExport | CategoryExport)[],
    axisEntityId: number
  ): ActorExport | CategoryExport {
    const foundAxisEntity = axisEntities.find((axisEntity) => axisEntity.id === axisEntityId);
    if (!foundAxisEntity) {
      throw new Error(`Could not find axis entity with ID ${axisEntityId}`);
    }
    return foundAxisEntity;
  }

  function getAnswersForPair(axisEntity1Id: number, axisEntity2Id: number): CreditExport[] {
    const usedTypesAndIds = new Set<string>();
    const answers: CreditExport[] = [];
    const actor1Answers = gridData.answers[axisEntity1Id];
    const actor2Answers = gridData.answers[axisEntity2Id];

    for (const actor1Answer of actor1Answers) {
      for (const actor2Answer of actor2Answers) {
        if (actor1Answer.type === actor2Answer.type && actor1Answer.id === actor2Answer.id) {
          // Skip if we've already added this credit to the answers
          if (usedTypesAndIds.has(`${actor1Answer.type}-${actor1Answer.id}`)) {
            continue;
          }

          // Look up this credit's title in the credits array
          const answer = gridData.credits.find((credit) => credit.id === actor1Answer.id);
          if (answer) {
            // Add to used set
            usedTypesAndIds.add(`${actor1Answer.type}-${actor1Answer.id}`);

            // Add to answers
            answers.push(answer);
          }
        }
      }
    }

    return answers;
  }

  return (
    <div className="flex flex-col items-center w-4/5 max-w-[800px] h-[75%] rounded-lg shadow-lg bg-white dark:bg-gray-800 overflow-y-auto py-5">
      {/* Show the "basic" stats */}
      <div className="flex flex-col items-center pb-6">
        <div className="text-2xl">
          <strong>Today's numbers</strong>
        </div>
        {Object.entries(gridStats).map(([key, stat]) => (
          <div key={key} className="pt-2">
            {stat.displayName}: {stat.value}
          </div>
        ))}
      </div>

      {/* Show the total number of possible answers for each square */}
      <div className="text-2xl pb-3">
        <strong>Total possible answers</strong>
      </div>
      <div className="grid-parent w-full min-h-full">
        <Grid size={3} gridDisplayData={getAllAnswerGridDisplayData()}></Grid>
      </div>
    </div>
  );
};

export default GameSummary;
