import { useEffect, useState } from "react";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Grid as GridData } from "../../common/src/interfaces";
import Grid from "./components/Grid";
import Overlay, { overlayContentsAtom } from "./components/Overlay";
import SearchBar from "./components/SearchBar";
import {
  AnyGridDisplayData,
  getGuessesRemainingGridDatum,
  getInitialGridDisplayData,
  gridDisplayDataAtom,
  insertGridDisplayDatumAtRowCol,
  insertInnerGridDisplayData,
} from "./gridDisplayData";
import { getAllAnswerGridDisplayData } from "./logic/PostGameLogic";
import { getGridDataFromS3, getS3ImageURLForType, preloadImageURL } from "./s3";
import {
  finalGameGridDisplayDataAtom,
  gameOverAtom,
  guessesRemainingAtom,
  selectedColAtom,
  selectedRowAtom,
} from "./state/GameState";

function App() {
  const [activeTab, setActiveTab] = useState<string>("Your answers");
  const [gridData, setGridData]: [GridData, any] = useState({} as GridData);
  const [gridDisplayData, setGridDisplayData] = useAtom(gridDisplayDataAtom);
  // This could be a set, but I think it's clearer if it's a list of objects like this
  const [isLoading, setIsLoading] = useState(true);

  const setSelectedRow = useSetAtom(selectedRowAtom);
  const setSelectedCol = useSetAtom(selectedColAtom);
  const [overlayContents, setOverlayContents] = useAtom(overlayContentsAtom);
  const guessesRemaining = useAtomValue(guessesRemainingAtom);
  const [gameOver, setGameOver] = useAtom(gameOverAtom);
  const [finalGameGridDisplayData, setFinalGameGridDisplayData] = useAtom(finalGameGridDisplayDataAtom);

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
              setOverlayContents(<SearchBar gridData={gridData} />);
            }
          },
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

  function endGame(gridDisplayData: AnyGridDisplayData[][]) {
    setFinalGameGridDisplayData(gridDisplayData);
    setGameOver(true);
    setSelectedRow(-1);
    setSelectedCol(-1);
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen dark:bg-gray-800 dark:text-white relative">
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

      <Overlay contents={overlayContents} />

      <Grid gridDisplayData={gridDisplayData} />
    </div>
  );
}

export default App;
