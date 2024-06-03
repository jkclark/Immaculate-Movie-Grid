// import React from 'react';
import { useEffect, useState } from 'react';
import Grid from './components/Grid';
import { getGridDataFromS3 } from './s3';
import { Grid as GridData } from '../../common/src/interfaces';
import SearchBar from './components/SearchBar';
import { GridDisplayData } from "./interfaces"
import GuessesRemainingDisplay from './components/GuessesRemainingDisplay';
import Summary from './components/Summary';

const BASE_S3_IMAGE_URL = "https://immaculate-movie-grid-images.s3.amazonaws.com";

function App() {
  const [guessesRemaining, setGuessesRemaining] = useState<number>(9);
  const [gridData, setGridData]: [GridData, any] = useState({} as GridData);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [selectedCol, setSelectedCol] = useState(-1);
  const [gridDisplayData, setGridDisplayData] = useState<GridDisplayData[][]>([[]]);
  // This could be a set, but I think it's clearer if it's a list of objects like this
  const [usedAnswers, setUsedAnswers] = useState<{ type: "movie" | "tv", id: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (Object.keys(gridData).length > 0) {
        return;
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];

      // Load the grid named with today's date
      const jsonData = await getGridDataFromS3("immaculate-movie-grid-daily-grids", `${todayString}.json`);

      // TODO: What should we do if there is no grid for today?

      console.log("Grid data:");
      console.log(jsonData);
      setGridData(jsonData);
      setGridDisplayData(getInitialGridDisplayData(jsonData));
      setIsLoading(false); // Show the "Give up" button
    }
    fetchData();
  }, [gridData]);

  const handlePageClick = () => {
    setSelectedRow(-1);
    setSelectedCol(-1);
  };

  function getInitialGridDisplayData(gridData: GridData): GridDisplayData[][] {
    const gridSize = gridData.actors.length / 2 + 1;
    const displayData: GridDisplayData[][] = [];
    for (let rowIndex = 0; rowIndex < gridSize; rowIndex++) {
      displayData.push([])
      for (let colIndex = 0; colIndex < gridSize; colIndex++) {
        if (rowIndex === 0 && colIndex === 0) {
          displayData[rowIndex].push({
            text: "",
            imageURL: "",
            div: GuessesRemainingDisplay(guessesRemaining),
          });
        } else if (rowIndex === 0 && colIndex !== 0) {
          const actorIndex = colIndex - 1;
          displayData[rowIndex].push({
            text: gridData.actors[actorIndex].name,
            imageURL: `${BASE_S3_IMAGE_URL}/actors/${gridData.actors[actorIndex].id}.jpg`
          });
        } else if (colIndex === 0 && rowIndex !== 0) {
          const actorIndex = gridSize - 1 + rowIndex - 1;
          displayData[rowIndex].push({
            text: gridData.actors[actorIndex].name,
            imageURL: `${BASE_S3_IMAGE_URL}/actors/${gridData.actors[actorIndex].id}.jpg`
          });
        } else {
          displayData[rowIndex].push({
            text: "",
            imageURL: ""
          });
        }
      }
    }

    return displayData;
  }

  function updateGridDisplayData(type: "movie" | "tv" | "actor", id: number, text: string): void {
    const typesToS3Prefixes = {
      actor: "actors",
      movie: "movies",
      tv: "tv-shows",
    }
    const newGridDisplayData = [...gridDisplayData];
    newGridDisplayData[selectedRow][selectedCol] = {
      text,
      imageURL: `${BASE_S3_IMAGE_URL}/${typesToS3Prefixes[type]}/${id}.jpg`
    };
    setGridDisplayData(newGridDisplayData);
  }

  function updateGuessesRemaining(newGuessesRemaining: number): void {
    const newGridDisplayData = [...gridDisplayData];
    newGridDisplayData[0][0] = {
      text: "",
      imageURL: "",
      div: GuessesRemainingDisplay(newGuessesRemaining),
    };
    setGuessesRemaining(newGuessesRemaining);
    setGridDisplayData(newGridDisplayData);
  }

  function checkAnswer(type: "movie" | "tv", id: number): boolean {
    if (selectedRow === -1 || selectedCol === -1) {
      throw new Error("Selected row or column is -1");
    }
    // We need to subtract 1 because the squares at the top and left of the grid are axis squares
    const dataRow = selectedRow - 1;
    const dataCol = selectedCol - 1;

    const acrossActorId = gridData.actors[dataCol].id;
    const downActorId = gridData.actors[3 + dataRow].id;
    const acrossCorrect = gridData.answers[acrossActorId].some(answer => answer.type === type && answer.id === id);
    const downCorrect = gridData.answers[downActorId].some(answer => answer.type === type && answer.id === id);

    // -1 guesses remaining
    updateGuessesRemaining(guessesRemaining - 1);

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

  function endGame() {
    setGameOver(true);
    updateGuessesRemaining(0);
    setSelectedRow(-1);
    setSelectedCol(-1);
  }

  return (
    <div onClick={handlePageClick} className="flex flex-col items-center justify-center h-screen dark:bg-gray-800 dark:text-white relative">
      {selectedRow !== -1 && selectedCol !== -1 ? <SearchBar checkAnswerFunc={checkAnswer} setTextAndImageFunc={updateGridDisplayData} usedAnswers={usedAnswers} /> : null}
      {selectedRow !== -1 && selectedCol !== -1 || gameOver ? <div className="absolute inset-0 bg-black opacity-50 z-20" /> : null}
      {gameOver ? <Summary {...gridData} /> : null}
      <Grid gridData={gridDisplayData} {...{ selectedRow, selectedCol, setSelectedRow, setSelectedCol }} />
      {!isLoading && <button onClick={endGame} className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded mt-4">Give up</button>}
    </div>
  );
}

export default App;
