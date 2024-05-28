// import React from 'react';
import { useEffect, useState } from 'react';
import Grid from './components/Grid';
import { getGridDataFromS3 } from './s3';
import { Grid as GridData } from '../../common/src/interfaces';
import SearchBar from './components/SearchBar';
import { GridDisplayData } from "./interfaces"
import GuessesRemainingDisplay from './components/GuessesRemainingDisplay';

const BASE_S3_IMAGE_URL = "https://immaculate-movie-grid-images.s3.amazonaws.com";

function App() {
  const [activeTab, setActiveTab] = useState<string>("Your answers")
  const [guessesRemaining, setGuessesRemaining] = useState<number>(9);
  const [gridData, setGridData]: [GridData, any] = useState({} as GridData);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [selectedCol, setSelectedCol] = useState(-1);
  const [gridDisplayData, setGridDisplayData] = useState<GridDisplayData[][]>([[]]);
  // This could be a set, but I think it's clearer if it's a list of objects like this
  const [usedAnswers, setUsedAnswers] = useState<{ type: "movie" | "tv", id: number }[]>([]);
  const [finalGameGridDisplayData, setFinalGameGridDisplayData] = useState<GridDisplayData[][]>([[]]);
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (Object.keys(gridData).length > 0) {
        return;
      }

      const jsonData = await getGridDataFromS3("immaculate-movie-grid-daily-grids", "test-grid-graph.json");
      console.log("Grid data:");
      console.log(jsonData);
      setGridData(jsonData);
      setGridDisplayData(getInitialGridDisplayData(jsonData));
      setIsLoading(false); // Show the "Give up" button
    }
    fetchData();
  }, []);

  const handlePageClick = () => {
    setSelectedRow(-1);
    setSelectedCol(-1);
  };

  function getInitialGridDisplayData(gridData: GridData): GridDisplayData[][] {
    const gridSize = gridData.actors.length / 2;
    const displayData: GridDisplayData[][] = [];
    for (let rowIndex = 0; rowIndex < gridSize + 1; rowIndex++) {
      displayData.push([])
      for (let colIndex = 0; colIndex < gridSize + 1; colIndex++) {
        if (rowIndex === 0 && colIndex === 0) {
          displayData[rowIndex].push({
            text: "",
            imageURL: "",
            div: GuessesRemainingDisplay(gridSize * gridSize),
          });
        } else if (rowIndex === 0 && colIndex !== 0) {
          const actorIndex = colIndex - 1;
          displayData[rowIndex].push({
            text: gridData.actors[actorIndex].name,
            imageURL: `${BASE_S3_IMAGE_URL}/actors/${gridData.actors[actorIndex].id}.jpg`
          });
        } else if (colIndex === 0 && rowIndex !== 0) {
          const actorIndex = gridSize + rowIndex - 1;
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

  function addAnswerToGridDisplayData(type: "movie" | "tv" | "actor", id: number, text: string): void {
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
    setFinalGameGridDisplayData(gridDisplayData);
    setGameOver(true);
    updateGuessesRemaining(0);
    setSelectedRow(-1);
    setSelectedCol(-1);
  }

  function insertInnerGridDisplayData(gridDisplayData: GridDisplayData[][], innerGridDisplayData: GridDisplayData[][]): GridDisplayData[][] {
    const newGridDisplayData = [...gridDisplayData];
    for (let rowIndex = 0; rowIndex < innerGridDisplayData.length; rowIndex++) {
      for (let colIndex = 0; colIndex < innerGridDisplayData[rowIndex].length; colIndex++) {
        // 1 + rowIndex and 1 + colIndex because the inner grid starts at (1, 1) in the outer grid
        newGridDisplayData[1 + rowIndex][1 + colIndex] = innerGridDisplayData[rowIndex][colIndex];
      }
    }
    return newGridDisplayData;
  }

  function getAnswersForPair(actor1Id: number, actor2Id: number): Set<string> {
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

  function getAllAnswerGridDisplayData(): GridDisplayData[][] {
    const newInnerGridData: GridDisplayData[][] = [];
    const acrossActors = gridData.actors.slice(0, gridData.actors.length / 2);
    const downActors = gridData.actors.slice(gridData.actors.length / 2);
    for (const acrossActor of acrossActors) {
      const innerGridRow: GridDisplayData[] = [];
      for (const downActor of downActors) {
        const answers = getAnswersForPair(acrossActor.id, downActor.id);
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

  return (
    <div onClick={handlePageClick} className="flex flex-col items-center justify-center h-screen dark:bg-gray-800 dark:text-white relative">
      {gameOver && (
        <div className="flex space-x-4">
          <button onClick={() => { setActiveTab("Your answers"); setGridDisplayData(finalGameGridDisplayData); }} className={`${activeTab === "Your answers" ? "bg-blue-700" : ""}`}>Your answers</button>
          <button onClick={() => { setActiveTab("All answers"); setGridDisplayData(getAllAnswerGridDisplayData()); }} className={`${activeTab === "All answers" ? "bg-blue-700" : ""}`}>
            All answers
          </button>
          <button onClick={() => setActiveTab("Popular answers")} className={`${activeTab === "Popular answers" ? "bg-blue-700" : ""}`}>
            Popular answers
          </button>
          <button onClick={() => setActiveTab("Answered %")} className={`${activeTab === "Answered %" ? "bg-blue-700" : ""}`}>
            Answered %
          </button>
        </div>
      )}

      {!isLoading && !gameOver && <button onClick={endGame}>Give up</button>}
      {selectedRow !== -1 && selectedCol !== -1 ? <SearchBar checkAnswerFunc={checkAnswer} setTextAndImageFunc={addAnswerToGridDisplayData} usedAnswers={usedAnswers} /> : null}
      {selectedRow !== -1 && selectedCol !== -1 ? <div className="absolute inset-0 bg-black opacity-50 z-20" /> : null}
      <Grid gridData={gridDisplayData} {...{ selectedRow, selectedCol, setSelectedRow, setSelectedCol }} />
    </div >
  );
}

export default App;
