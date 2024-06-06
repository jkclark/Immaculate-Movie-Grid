import { useEffect, useState } from "react";

import { useAtom } from "jotai";
import { Grid as GridData } from "../../common/src/interfaces";
import Grid from "./components/Grid";
import SearchBar from "./components/SearchBar";
import { AnyGridDisplayData } from "./gridDisplayData";
import GameLogic from "./logic/GameLogic";
import { getAllAnswerGridDisplayData } from "./logic/PostGameLogic";
import { getGridDataFromS3, getS3ImageURLForType, preloadImageURL } from "./s3";
import {
  finalGameGridDisplayDataAtom,
  gameOverAtom,
  selectedColAtom,
  selectedRowAtom,
} from "./state/GameState";

function App() {
  const [activeTab, setActiveTab] = useState<string>("Your answers");
  const [gridData, setGridData]: [GridData, any] = useState({} as GridData);
  const [gridDisplayData, setGridDisplayData] = useState<AnyGridDisplayData[][]>([[]]);
  // This could be a set, but I think it's clearer if it's a list of objects like this
  const [isLoading, setIsLoading] = useState(true);
  const selectedRow = useAtom(selectedRowAtom)[0];
  const selectedCol = useAtom(selectedColAtom)[0];
  const gameOver = useAtom(gameOverAtom)[0];
  const finalGameGridDisplayData = useAtom(finalGameGridDisplayDataAtom)[0];

  const {
    // Functions
    getInitialGameGridDisplayData,
    addAnswerToGridDisplayData,
    checkAnswer,
    closeOverlay,
    endGame,
  } = GameLogic(gridDisplayData, setGridDisplayData);

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
      setGridDisplayData(getInitialGameGridDisplayData(jsonData));
      setIsLoading(false); // Show the "Give up" button
    }
    fetchData();
  }, []);

  // Preload all other images once the page has loaded
  useEffect(() => {
    if (!isLoading) {
      async function preloadImages() {
        await Promise.all(
          gridData.credits.map((credit) => {
            const imageURL = getS3ImageURLForType(credit.type, credit.id);
            return preloadImageURL(imageURL);
          })
        );
      }
      preloadImages();
    }
  }, [isLoading]);

  return (
    <div
      onClick={closeOverlay}
      className="flex flex-col items-center justify-center h-screen dark:bg-gray-800 dark:text-white relative"
    >
      {gameOver && (
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setActiveTab("Your answers");
              setGridDisplayData(finalGameGridDisplayData);
            }}
            className={`${activeTab === "Your answers" ? "bg-blue-700" : ""}`}
          >
            Your answers
          </button>
          <button
            onClick={() => {
              setActiveTab("All answers");
              setGridDisplayData(getAllAnswerGridDisplayData(gridData));
            }}
            className={`${activeTab === "All answers" ? "bg-blue-700" : ""}`}
          >
            All answers
          </button>
        </div>
      )}

      {!isLoading && !gameOver && (
        <button
          onClick={() => {
            endGame(gridDisplayData);
          }}
        >
          Give up
        </button>
      )}
      {selectedRow !== -1 && selectedCol !== -1 ? (
        <SearchBar
          checkAnswerFunc={checkAnswer}
          setTextAndImageFunc={addAnswerToGridDisplayData}
          {...{ gridData, gridDisplayData, setGridDisplayData }}
        />
      ) : null}

      {selectedRow !== -1 && selectedCol !== -1 ? (
        <div className="absolute inset-0 bg-black opacity-50 z-20" />
      ) : null}
      <Grid gridDisplayData={gridDisplayData} />
    </div>
  );
}

export default App;
