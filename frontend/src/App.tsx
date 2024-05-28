// import React from 'react';
import { useEffect, useState } from 'react';

import { Grid as GridData } from '../../common/src/interfaces';
import Grid from './components/Grid';
import SearchBar from './components/SearchBar';
import { GridDisplayData } from "./interfaces";
import gameLogic, { BASE_S3_IMAGE_URL } from './logic/gameLogic';
import { getGridDataFromS3 } from './s3';

function App() {
  const [activeTab, setActiveTab] = useState<string>("Your answers")
  const [gridData, setGridData]: [GridData, any] = useState({} as GridData);
  const [gridDisplayData, setGridDisplayData] = useState<GridDisplayData[][]>([[]]);
  // This could be a set, but I think it's clearer if it's a list of objects like this
  const [isLoading, setIsLoading] = useState(true);

  const {
    selectedRow,
    selectedCol,
    setSelectedRow,
    setSelectedCol,
    usedAnswers,
    gameOver,
    finalGameGridDisplayData,
    addAnswerToGridDisplayData,
    checkAnswer,
    closeOverlay,
    endGame,
  } = gameLogic();

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

  function getInitialGridDisplayData(gridData: GridData): GridDisplayData[][] {
    const gridSize = gridData.actors.length / 2;
    const displayData: GridDisplayData[][] = [];
    for (let rowIndex = 0; rowIndex < gridSize + 1; rowIndex++) {
      displayData.push([])
      for (let colIndex = 0; colIndex < gridSize + 1; colIndex++) {
        if (rowIndex === 0 && colIndex !== 0) {
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

  return (
    <div onClick={closeOverlay} className="flex flex-col items-center justify-center h-screen dark:bg-gray-800 dark:text-white relative">
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

      {!isLoading && !gameOver && <button onClick={() => { endGame(gridDisplayData); }}>Give up</button>}
      {selectedRow !== -1 && selectedCol !== -1 ? (
        <SearchBar
          checkAnswerFunc={checkAnswer}
          setTextAndImageFunc={addAnswerToGridDisplayData}
          {...{ gridData, gridDisplayData, setGridDisplayData }}
          usedAnswers={usedAnswers}
        />
      ) : null
      }

      {selectedRow !== -1 && selectedCol !== -1 ? <div className="absolute inset-0 bg-black opacity-50 z-20" /> : null}
      <Grid gridDisplayData={gridDisplayData} {...{ selectedRow, selectedCol, setSelectedRow, setSelectedCol }} />
    </div >
  );
}

export default App;
