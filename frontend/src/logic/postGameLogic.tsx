import { Grid as GridData } from '../../../common/src/interfaces';
import { getInitialGridDisplayData, insertInnerGridDisplayData } from '../gridDisplayData';
import { GridDisplayData } from '../interfaces';

export function postGameLogic() {
  function getAnswersForPair(
    actor1Id: number,
    actor2Id: number,
    gridData: GridData
  ): Set<string> {
    const answerNames: Set<string> = new Set();
    const actor1Answers = gridData.answers[actor1Id];
    const actor2Answers = gridData.answers[actor2Id];

    for (const actor1Answer of actor1Answers) {
      for (const actor2Answer of actor2Answers) {
        if (actor1Answer.type === actor2Answer.type && actor1Answer.id === actor2Answer.id) {
          // Look up this credit's title in the credits array
          const answer = gridData.credits.find((credit) => credit.id === actor1Answer.id);
          if (answer) {
            answerNames.add(answer.name);
          }
        }
      }
    }

    return answerNames;
  }

  function getAllAnswerGridDisplayData(gridData: GridData): GridDisplayData[][] {
    const newInnerGridData: GridDisplayData[][] = [];
    const acrossActors = gridData.actors.slice(0, gridData.actors.length / 2);
    const downActors = gridData.actors.slice(gridData.actors.length / 2);
    for (const acrossActor of acrossActors) {
      const innerGridRow: GridDisplayData[] = [];
      for (const downActor of downActors) {
        const answers = getAnswersForPair(acrossActor.id, downActor.id, gridData);
        const answerText = `${Array.from(answers).length}`;
        innerGridRow.push({
          text: "",
          imageURL: "",
          div: <div className="flex items-center justify-center h-full text-7xl">{answerText}</div>
        });
      }
      newInnerGridData.push(innerGridRow);
    }

    const newGridData = getInitialGridDisplayData(gridData);
    // Replace "guesses left" with total number of answers
    newGridData[0][0] = {
      text: "",
      imageURL: "",
      div: (
        <div className="text-center">
          <div className="text-7xl">{gridData.credits.length}</div>
          <div className="text-xl">total</div>
        </div>
      )
    };
    return insertInnerGridDisplayData(newGridData, newInnerGridData);
  }

  return {
    getAllAnswerGridDisplayData: getAllAnswerGridDisplayData,
  }
}

export default postGameLogic;
