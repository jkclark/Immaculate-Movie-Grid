import { useState } from "react";
import { Grid as GridData } from "../../../common/src/interfaces";
import { AnyGridDisplayData, getInitialGridDisplayData, insertGridDisplayDatumAtRowCol, insertInnerGridDisplayData } from "../gridDisplayData";
import { getS3ImageURLForType } from "../s3";

export function GameLogic() {
  const [guessesRemaining, setGuessesRemaining] = useState<number>(9);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [selectedCol, setSelectedCol] = useState(-1);
  const [usedAnswers, setUsedAnswers] = useState<{ type: "movie" | "tv", id: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [finalGameGridDisplayData, setFinalGameGridDisplayData] = useState<AnyGridDisplayData[][]>([[]]);

  function getGuessesRemainingGridDatum(newGuessesRemaining: number): AnyGridDisplayData {
    return {
      mainText: `${newGuessesRemaining}`,
      subText: "guesses left",
    }
  }

  function getInitialGameGridDisplayData(gridData: GridData): AnyGridDisplayData[][] {
    const newInnerGridData: AnyGridDisplayData[][] = [];

    // Create squares for inner grid
    for (let rowIndex = 0; rowIndex < gridData.actors.length / 2; rowIndex++) {
      const innerGridRow: AnyGridDisplayData[] = [];
      for (let colIndex = 0; colIndex < gridData.actors.length / 2; colIndex++) {
        innerGridRow.push({
          clickHandler: () => {
            if (!gameOver) {
              setSelectedRow(rowIndex + 1);
              setSelectedCol(colIndex + 1);
              console.log(`Clicked on ${rowIndex}, ${colIndex}`);
            }
          }
        });
      }
      newInnerGridData.push(innerGridRow);
    }

    // Get grid data with axes populated
    const newGridData = getInitialGridDisplayData(gridData);

    // Add guesses left
    const newGridDataWithGuesses = insertGridDisplayDatumAtRowCol(
      getGuessesRemainingGridDatum(guessesRemaining),
      0,
      0,
      newGridData
    );

    // Insert inner grid into outer grid
    return insertInnerGridDisplayData(newGridDataWithGuesses, newInnerGridData);
  }

  function addAnswerToGridDisplayData(
    type: "movie" | "tv" | "actor",
    id: number,
    text: string,
    gridDisplayData: AnyGridDisplayData[][],
    setGridDisplayData: (gridDisplayData: AnyGridDisplayData[][]) => void
  ): void {
    setGridDisplayData(
      insertGridDisplayDatumAtRowCol(
        {
          hoverText: text,
          imageURL: getS3ImageURLForType(type, id),
        },
        selectedRow,
        selectedCol,
        gridDisplayData,
      )
    )
  }

  function updateGuessesRemaining(
    newGuessesRemaining: number,
    gridDisplayData: AnyGridDisplayData[][],
    setGridDisplayData: (gridDisplayData: AnyGridDisplayData[][]) => void
  ): void {
    setGridDisplayData(
      insertGridDisplayDatumAtRowCol(
        getGuessesRemainingGridDatum(newGuessesRemaining),
        0,
        0,
        gridDisplayData,
      )
    );
    setGuessesRemaining(newGuessesRemaining);
  }

  function checkAnswer(
    type: "movie" | "tv",
    id: number,
    gridData: GridData,
    gridDisplayData: AnyGridDisplayData[][],
    setGridDisplayData: (gridDisplayData: AnyGridDisplayData[][]) => void
  ): boolean {
    if (selectedRow === -1 || selectedCol === -1) {
      throw new Error("Selected row or column is -1");
    }

    // - 1 because the first row and column are the axes
    const dataRow = selectedRow - 1;
    const dataCol = selectedCol - 1;

    const acrossActorId = gridData.actors[dataCol].id;
    const downActorId = gridData.actors[3 + dataRow].id;
    const acrossCorrect = gridData.answers[acrossActorId].some(answer => answer.type === type && answer.id === id);
    const downCorrect = gridData.answers[downActorId].some(answer => answer.type === type && answer.id === id);

    // -1 guesses remaining
    updateGuessesRemaining(guessesRemaining - 1, gridDisplayData, setGridDisplayData);

    if (acrossCorrect && downCorrect) {
      console.log("Correct!");
      // Add this answer to used answers
      setUsedAnswers([...usedAnswers, { type, id }]);

      // Hide search bar
      setSelectedRow(-1);
      setSelectedCol(-1);
      return true;
    } else {
      console.log("Wrong!");
      return false;
    }
  }

  function closeOverlay() {
    setSelectedRow(-1);
    setSelectedCol(-1);
  }

  function endGame(gridDisplayData: AnyGridDisplayData[][]) {
    setFinalGameGridDisplayData(gridDisplayData);
    setGameOver(true);
    setSelectedRow(-1);
    setSelectedCol(-1);
  }

  return {
    // State
    selectedRow,
    selectedCol,
    setSelectedRow,
    setSelectedCol,
    usedAnswers,
    gameOver,
    finalGameGridDisplayData,

    // Functions
    getInitialGameGridDisplayData,
    addAnswerToGridDisplayData,
    checkAnswer,
    closeOverlay,
    endGame,
  }
}

export default GameLogic;
