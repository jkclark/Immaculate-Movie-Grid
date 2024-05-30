// import React from 'react';
import { useEffect, useState } from 'react';

import { Grid as GridData } from '../../common/src/interfaces';
import Grid from './components/Grid';
import SearchBar from './components/SearchBar';
import { AnyGridDisplayData } from "./gridDisplayData";
import GameLogic from './logic/GameLogic';
import PostGameLogic from './logic/PostGameLogic';
import { getGridDataFromS3 } from './s3';

function App() {
  const [activeTab, setActiveTab] = useState<string>("Your answers")
  const [gridData, setGridData]: [GridData, any] = useState({} as GridData);
  const [gridDisplayData, setGridDisplayData] = useState<AnyGridDisplayData[][]>([[]]);
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
    getGameGridDisplayData,
    addAnswerToGridDisplayData,
    checkAnswer,
    closeOverlay,
    endGame,
  } = GameLogic();

  const {
    getAllAnswerGridDisplayData,
  } = PostGameLogic();

  useEffect(() => {
    async function fetchData() {
      if (Object.keys(gridData).length > 0) {
        return;
      }

      const jsonData = await getGridDataFromS3("immaculate-movie-grid-daily-grids", "test-grid-graph.json");
      console.log("Grid data:");
      console.log(jsonData);
      setGridData(jsonData);
      setGridDisplayData(getGameGridDisplayData(jsonData));
      setIsLoading(false); // Show the "Give up" button
    }
    fetchData();
  }, []);

  return (
    <div onClick={closeOverlay} className="flex flex-col items-center justify-center h-screen dark:bg-gray-800 dark:text-white relative">
      {gameOver && (
        <div className="flex space-x-4">
          <button onClick={() => { setActiveTab("Your answers"); setGridDisplayData(finalGameGridDisplayData); }} className={`${activeTab === "Your answers" ? "bg-blue-700" : ""}`}>Your answers</button>
          <button onClick={() => { setActiveTab("All answers"); setGridDisplayData(getAllAnswerGridDisplayData(gridData)); }} className={`${activeTab === "All answers" ? "bg-blue-700" : ""}`}>
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
