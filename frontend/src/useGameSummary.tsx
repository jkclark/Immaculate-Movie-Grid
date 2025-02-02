import { Stats } from "common/src/db/stats";
import { ActorExport, CategoryExport, CreditExport, GridExport } from "common/src/interfaces";
import CorrectCreditsSummary from "./components/CorrectCreditsSummary";
import { useOverlayStack } from "./components/Overlay";
import {
  AnyGridDisplayData,
  getBlankGridDisplayData,
  getInitialGridDisplayData,
  insertInnerGridDisplayData,
  TextGridDisplayData,
} from "./gridDisplayData";
import { getS3BackupImageURLForType, getS3ImageURLForType } from "./s3";

export function useGameSummary() {
  const { addContentsToOverlay } = useOverlayStack();

  /*** Basic stats ***/
  // TODO
  // Mapping of basic stat names to the number of decimals we should show, if any
  const statToDecimals: { [key: string]: number } = {
    avgScore: 2,
    numGames: 0,
  };

  /*** All correct answers ***/
  function getAllAnswerGridDisplayData(gridData: GridExport): AnyGridDisplayData[][] {
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

        const answers = getAnswersForPair(gridData, acrossAxisEntity.id, downAxisEntity.id);
        const answerText = `${answers.length}`;
        innerGridRow.push({
          mainText: answerText,
          clickHandler: () => {
            addContentsToOverlay(<CorrectCreditsSummary credits={answers} />);
          },
          cursor: "pointer",
        });
      }
      newInnerGridData.push(innerGridRow);
    }

    return insertInnerGridDisplayData(getInitialGridDisplayData(gridData), newInnerGridData);
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

  function getAnswersForPair(
    gridData: GridExport,
    axisEntity1Id: number,
    axisEntity2Id: number
  ): CreditExport[] {
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

  /*** Accuracy ***/
  function getAccuracyGridDisplayData(gridData: GridExport, gridStats: Stats): AnyGridDisplayData[][] {
    const gridSize = 3;
    // We subtract 1 because the getBlankGridDisplayData function adds an extra row and column
    // for the axes
    const newInnerGridData: AnyGridDisplayData[][] = getBlankGridDisplayData(gridSize - 1);
    const indexArray = Array.from({ length: gridSize }, (_, i) => i);
    if (gridStats.squarePercentages) {
      for (const downIndex of indexArray) {
        for (const acrossIndex of indexArray) {
          const percentage = gridStats.squarePercentages[`${acrossIndex}-${downIndex}`] || 0;
          newInnerGridData[downIndex][acrossIndex] = {
            mainText: `${roundToNearestNDigits(percentage, 0)}%`,
          };
        }
      }
    }

    return insertInnerGridDisplayData(getInitialGridDisplayData(gridData), newInnerGridData);
  }

  /*** Most common ***/
  function getMostCommonGridDisplayData(gridData: GridExport, gridStats: Stats): AnyGridDisplayData[][] {
    const gridSize = 3;
    // We subtract 1 because the getBlankGridDisplayData function adds an extra row and column
    // for the axes
    const newInnerGridData: AnyGridDisplayData[][] = getBlankGridDisplayData(gridSize - 1);
    if (gridStats.allAnswers) {
      for (const [rowCol, answers] of Object.entries(gridStats.allAnswers)) {
        // Get get row, col for the square
        const [acrossIndex, downIndex] = rowCol.split("-").map((num) => parseInt(num));

        // Find the answer used the most times
        const [maxAnswerCreditUniqueString, maxAnswerInfo] = Object.entries(answers).reduce((a, b) =>
          a[1].timesUsed > b[1].timesUsed ? a : b
        );

        // Find the total number of answers
        const totalAnswers = Object.values(answers).reduce((total, answer) => total + answer.timesUsed, 0);

        // Split the key into type and id
        let [type, id] = maxAnswerCreditUniqueString.split("-") as ["movie" | "tv", string];

        const answerPercentage = roundToNearestNDigits(100 * (maxAnswerInfo.timesUsed / totalAnswers), 0);

        // Insert the data into the grid
        newInnerGridData[downIndex][acrossIndex] = {
          hoverText: maxAnswerInfo.name,
          imageURL: getS3ImageURLForType(type, parseInt(id)),
          backupImageURL: getS3BackupImageURLForType(type),
          cornerText: `${answerPercentage}%`,
        };
      }
    }

    return insertInnerGridDisplayData(getInitialGridDisplayData(gridData), newInnerGridData);
  }

  /*** Utils ***/
  function roundToNearestNDigits(num: number, n: number): string {
    return (Math.round(num * 100) / 100).toFixed(n);
  }

  return {
    getAllAnswerGridDisplayData,
    getAccuracyGridDisplayData,
    getMostCommonGridDisplayData,
  };
}
