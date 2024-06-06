import { CreditExport, Grid as GridData } from "../../../common/src/interfaces";
import {
  AnyGridDisplayData,
  TextGridDisplayData,
  getInitialGridDisplayData,
  insertGridDisplayDatumAtRowCol,
  insertInnerGridDisplayData,
} from "../gridDisplayData";

export function getAllAnswerGridDisplayData(
  gridData: GridData,
): AnyGridDisplayData[][] {
  const newInnerGridData: TextGridDisplayData[][] = [];
  const acrossActors = gridData.actors.slice(0, gridData.actors.length / 2);
  const downActors = gridData.actors.slice(gridData.actors.length / 2);
  for (const downActor of downActors) {
    const innerGridRow: TextGridDisplayData[] = [];
    for (const acrossActor of acrossActors) {
      const answers = getAnswersForPair(acrossActor.id, downActor.id, gridData);
      const answerText = `${answers.length}`;
      innerGridRow.push({
        mainText: answerText,
        clickHandler: () => {
          console.log(`Clicked on ${acrossActor.name} and ${downActor.name}`);
        },
      });
    }
    newInnerGridData.push(innerGridRow);
  }

  // Get grid data with axes populated
  const newGridData: AnyGridDisplayData[][] =
    getInitialGridDisplayData(gridData);

  // Replace "guesses left" with total number of answers
  const newGridDataWithTotal = insertGridDisplayDatumAtRowCol(
    {
      mainText: `${gridData.credits.length}`,
      subText: "total",
    },
    0,
    0,
    newGridData,
  );
  return insertInnerGridDisplayData(newGridDataWithTotal, newInnerGridData);
}

function getAnswersForPair(
  actor1Id: number,
  actor2Id: number,
  gridData: GridData,
): CreditExport[] {
  const usedTypesAndIds = new Set<string>();
  const answers: CreditExport[] = [];
  const actor1Answers = gridData.answers[actor1Id];
  const actor2Answers = gridData.answers[actor2Id];

  for (const actor1Answer of actor1Answers) {
    for (const actor2Answer of actor2Answers) {
      if (
        actor1Answer.type === actor2Answer.type &&
        actor1Answer.id === actor2Answer.id
      ) {
        // Skip if we've already added this credit to the answers
        if (usedTypesAndIds.has(`${actor1Answer.type}-${actor1Answer.id}`)) {
          continue;
        }

        // Look up this credit's title in the credits array
        const answer = gridData.credits.find(
          (credit) => credit.id === actor1Answer.id,
        );
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
