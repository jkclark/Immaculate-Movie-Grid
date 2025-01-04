import { ActorExport, CategoryExport, CreditExport } from "common/src/interfaces";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";

import { AnyGridDisplayData, getBlankGridDisplayData, TextGridDisplayData } from "../gridDisplayData";
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
    const answers: CreditExport[] = [];

    const entity1Answers = gridData.answers[axisEntity1Id];
    const entity2Answers = gridData.answers[axisEntity2Id];

    // Only iterate over the smaller set of answers
    const entity1HasMoreAnswers = entity1Answers.size > entity2Answers.size;
    const [entityWithMoreAnswersAnswers, entityWithFewerAnswersAnswers] = entity1HasMoreAnswers
      ? [entity1Answers, entity2Answers]
      : [entity2Answers, entity1Answers];

    for (const potentialAnswer of entityWithFewerAnswersAnswers) {
      if (entityWithMoreAnswersAnswers.has(potentialAnswer)) {
        const answer = gridData.credits[potentialAnswer];
        if (answer) {
          // Add to answers
          answers.push(answer);
        } else {
          console.error(`Error: could not find credit for credit unique string ${potentialAnswer}`);
        }
      }
    }

    return answers;
  }

  function getAccuracyGridDisplayData(): AnyGridDisplayData[][] {
    const gridSize = 3;
    // We subtract 1 because the getBlankGridDisplayData function adds an extra row and column
    // for the axes
    const newGridData: AnyGridDisplayData[][] = getBlankGridDisplayData(gridSize - 1);
    const indexArray = Array.from({ length: gridSize }, (_, i) => i);
    if (gridStats.squarePercentages) {
      for (const downIndex of indexArray) {
        for (const acrossIndex of indexArray) {
          const percentage = gridStats.squarePercentages[`${acrossIndex}-${downIndex}`] || 0;
          newGridData[downIndex][acrossIndex] = {
            mainText: `${roundToNearestInteger(percentage)}%`,
          };
        }
      }
    }

    return newGridData;
  }

  function roundToNearestInteger(num: number): string {
    return (Math.round(num * 100) / 100).toFixed(0);
  }

  return (
    <div
      className="grid-grandparent w-4/5 max-w-[800px] h-[75%] rounded-lg shadow-lg bg-white dark:bg-gray-800 overflow-y-auto py-5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Show the "basic" stats */}
      {gridStats.basicStats && (
        <>
          <div className="flex flex-col items-center mb-10">
            <div className="text-2xl">
              <strong>Today's numbers</strong>
            </div>
            {Object.entries(gridStats.basicStats).map(([key, stat]) => (
              <div key={key} className="pt-2">
                {stat.displayName}: {stat.value}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Show the total number of possible answers for each square */}
      <div className="text-2xl pb-3 text-center">
        <strong>Total possible answers</strong>
      </div>
      <div className="grid-parent max-h-[80%] px-4 mb-10 mx-auto">
        <Grid size={3} gridDisplayData={getAllAnswerGridDisplayData()}></Grid>
      </div>

      {/* Show players' accuracy for each square */}
      {gridStats.squarePercentages && (
        <>
          <div className="text-2xl pb-3 text-center">
            <strong>Accuracy</strong>
          </div>
          <div className="grid-parent max-h-[80%] px-4 mx-auto">
            <Grid size={3} gridDisplayData={getAccuracyGridDisplayData()}></Grid>
          </div>
        </>
      )}
    </div>
  );
};

export default GameSummary;
