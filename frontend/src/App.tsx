import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import { GridExport } from "common/src/interfaces";
import { hitAPIGet } from "./api";
import Grid from "./components/Grid";
import Navbar from "./components/Navbar";
import Overlay, { useOverlayStack } from "./components/Overlay";
import SearchBar from "./components/SearchBar";
import TabBar from "./components/TabBar";
import {
  ACCURACY_TAB_TEXT,
  ALL_CORRECT_ANSWERS_TAB_TEXT,
  MOST_COMMON_ANSWERS_TAB_TEXT,
  YOUR_ANSWERS_TAB_TEXT,
} from "./constants";
import {
  AnyGridDisplayData,
  getGuessesRemainingGridDatum,
  getInitialGridDisplayData,
  gridDisplayDataAtom,
  insertGridDisplayDatumAtRowCol,
  insertInnerGridDisplayData,
} from "./gridDisplayData";
import { getGridDataFromS3, getS3BackupImageURLForType, getS3ImageURLForType } from "./s3";
import {
  activeTabAtom,
  finalGameGridDisplayDataAtom,
  gameOverAtom,
  getRowColKey,
  gridDataAtom,
  gridIdAtom,
  gridStatsAtom,
  guessesRemainingAtom,
  scoreIdAtom,
  selectedColAtom,
  selectedRowAtom,
  usedAnswersAtom,
} from "./state";
import { useStats } from "./stats";
import { useGameSummary } from "./useGameSummary";

function App() {
  const [gridId, setGridId] = useAtom(gridIdAtom);
  const [gridData, setGridData] = useAtom(gridDataAtom);
  const [gridDisplayData, setGridDisplayData] = useAtom(gridDisplayDataAtom);
  // This could be a set, but I think it's clearer if it's a list of objects like this
  const [isLoading, setIsLoading] = useState(true);
  const [gridLoadError, setGridLoadError] = useState(false);

  const setSelectedRow = useSetAtom(selectedRowAtom);
  const setSelectedCol = useSetAtom(selectedColAtom);
  const { addContentsToOverlay, resetOverlayContents } = useOverlayStack();
  const [scoreId, setScoreId] = useAtom(scoreIdAtom);
  const [guessesRemaining, setGuessesRemaining] = useAtom(guessesRemainingAtom);
  const [usedAnswers, setUsedAnswers] = useAtom(usedAnswersAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const [finalGameGridDisplayData, setFinalGameGridDisplayData] = useAtom(finalGameGridDisplayDataAtom);
  const { getAllAnswerGridDisplayData, getAccuracyGridDisplayData, getMostCommonGridDisplayData } =
    useGameSummary();
  const [gameOver, setGameOver] = useAtom(gameOverAtom);
  const [gridStats, setGridStats] = useAtom(gridStatsAtom);
  const { updateStatsForGrid, endGameForGrid } = useStats();

  // On page load, hit the search Lambda function to warm it up
  useEffect(() => {
    hitAPIGet("search?query=immaculate-movie-grid-search-warm-up");
  }, []);

  // On page load, load the grid data
  useEffect(() => {
    async function fetchData() {
      // * Get the date of the grid to load *
      // If it is at or after 6AM for this computer's timezone, we can load today's grid
      // Otherwise, we need to load yesterday's grid
      const today = new Date();
      if (today.getHours() < 6) {
        today.setDate(today.getDate() - 1);
      }
      const todayString = today.toLocaleDateString("en-CA");

      // If gridId is not set to the current puzzle's date, there is (supposed to be)
      // a different grid available
      if (gridId !== todayString) {
        console.log("Grid ID is not today's date, loading grid data");

        // Reset the game state
        resetGame();

        // Load the grid named with today's date
        const jsonData = await getGridDataForDate(todayString);

        if (Object.keys(jsonData).length === 0) {
          console.error("No grid data found for today...");
          setGridLoadError(true);
          return;
        }

        // Save the grid's ID (which is today's date) to localStorage
        setGridId(jsonData.id);

        setGridData(jsonData);
      }

      // If gridId *is* the same as today's date, we've already been playing today's
      // grid, so we don't need to do anything
      else {
        console.log("Setting game back to the way it was");
      }
    }
    fetchData();
  }, []);

  // Whenever we're seeing a new grid ID (e.g., the page is loading for the first time)
  // get the stats for the grid
  useEffect(() => {
    async function fetchStats() {
      if (gridId === "") {
        return;
      }

      await updateStatsForGrid(gridId);
    }
    fetchStats();
  }, [gridId]);

  // Once we've loaded the grid data, populate the grid display data
  useEffect(() => {
    if (Object.keys(gridData).length === 0) {
      return;
    }

    if (gameOver) {
      setGridDisplayData(finalGameGridDisplayData);
    } else {
      setGridDisplayData(getInitialGameGridDisplayData());
    }

    setIsLoading(false);
  }, [gridData]);

  // End the game if there are no guesses remaining
  useEffect(() => {
    if (guessesRemaining <= 0) {
      // Remember, the backend is notified of the game being over
      // by receiving the 9th guess, which is the maximum number of guesses
      // allowed
      endGame();
    }
  }, [guessesRemaining]);

  // Update the accuracy and most common answers tabs when the grid stats change
  useEffect(() => {
    if (activeTab === ACCURACY_TAB_TEXT) {
      setGridDisplayData(getAccuracyGridDisplayData(gridData, gridStats));
    } else if (activeTab === MOST_COMMON_ANSWERS_TAB_TEXT) {
      setGridDisplayData(getMostCommonGridDisplayData(gridData, gridStats));
    }
  }, [gridStats, activeTab]);

  async function getGridDataForDate(dateString: string): Promise<GridExport> {
    // Load the grid named with today's date
    let jsonData = await getGridDataFromS3("immaculate-movie-grid-daily-grids", `${dateString}.json`);

    if (Object.keys(jsonData).length === 0) {
      console.error("No grid data found for today...");
    }

    return jsonData;
  }

  /**
   * Get the initial game grid display data, including used answers if there is a grid in progress.
   *
   * This function isn't called if the game is already over.
   *
   * @param fresh whether or not to include usedAnswers from localstorage
   * @returns a 2D array of AnyGridDisplayData representing the initial game grid
   */
  function getInitialGameGridDisplayData(): AnyGridDisplayData[][] {
    const newInnerGridData: AnyGridDisplayData[][] = [];

    // Create squares for inner grid
    for (let rowIndex = 0; rowIndex < gridData.axes.length / 2; rowIndex++) {
      const innerGridRow: AnyGridDisplayData[] = [];
      for (let colIndex = 0; colIndex < gridData.axes.length / 2; colIndex++) {
        // This square was already answered correctly
        if (usedAnswers[getRowColKey(rowIndex, colIndex)]) {
          console.log(`Restoring used answer for row ${rowIndex} and col ${colIndex}`);
          const { type, id, name } = usedAnswers[getRowColKey(rowIndex, colIndex)];
          innerGridRow.push({
            hoverText: name,
            imageURL: getS3ImageURLForType(type, id),
            backupImageURL: getS3BackupImageURLForType(type),
          });
        }

        // This square is empty
        else {
          const squareDisplayData: AnyGridDisplayData = {
            clickHandler: () => {
              if (!gameOver) {
                setSelectedRow(rowIndex + 1);
                setSelectedCol(colIndex + 1);
                addContentsToOverlay(<SearchBar />);
              }
            },
            cursor: "pointer",
            border: "border-theme-light-other-1 dark:border-theme-dark-other-1",
          };

          innerGridRow.push(squareDisplayData);
        }
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

  function resetGame() {
    setGridDisplayData([]);
    setSelectedRow(-1);
    setSelectedCol(-1);
    setGuessesRemaining(9);
    setGameOver(false);
    setUsedAnswers({});
    setScoreId(undefined);
    setGridStats({});
    setFinalGameGridDisplayData([]);
  }

  function cleanUpGameGridDisplayDataUponEnd() {
    // NOTE: I'm not sure why but this smells like a hack
    // 1. Remove "cursor: 'pointer'" from all squares
    // 2. Remove custom border
    const newGridDisplayData = gridDisplayData.map((row) =>
      row.map((square) => {
        const newSquare = { ...square };
        delete newSquare.cursor;
        delete newSquare.border;
        return newSquare;
      })
    );

    return newGridDisplayData;
  }

  function endGame() {
    setGameOver(true);
    setSelectedRow(-1);
    setSelectedCol(-1);

    // Remove click handlers, update text, etc. when game is over
    const gameOverGridDisplayData = cleanUpGameGridDisplayDataUponEnd();
    setGridDisplayData(gameOverGridDisplayData);
    // Remember this grid data so we can restore it when the user switches
    // back to the "Your answers" tab
    setFinalGameGridDisplayData(gameOverGridDisplayData);

    // Make sure to hide the search bar and search results if the last guess
    // is an incorrect one
    resetOverlayContents();
  }

  const tabInfo = {
    yourAnswers: {
      label: YOUR_ANSWERS_TAB_TEXT,
      onClick: () => {
        console.log("Your answers");
        setGridDisplayData(finalGameGridDisplayData);
      },
    },
    allAnswers: {
      label: ALL_CORRECT_ANSWERS_TAB_TEXT,
      onClick: () => {
        console.log("All answers");
        setGridDisplayData(getAllAnswerGridDisplayData(gridData));
      },
    },
    accuracy: {
      label: ACCURACY_TAB_TEXT,
      onClick: () => {
        console.log("Accuracy");
        setGridDisplayData(getAccuracyGridDisplayData(gridData, gridStats));
      },
    },
    mostCommonAnswers: {
      label: MOST_COMMON_ANSWERS_TAB_TEXT,
      onClick: () => {
        console.log("Most common");
        setGridDisplayData(getMostCommonGridDisplayData(gridData, gridStats));
      },
    },
  };

  return (
    <div className="flex flex-col h-dvh bg-theme-primary items-center">
      <Navbar />

      <Overlay />

      <div className="grid-grandparent w-full max-w-[800px] flex flex-col flex-grow items-center justify-center">
        {/* <div className="w-full flex flex-col flex-grow items-center justify-center"> */}
        {gridLoadError && <div>There was an error loading the grid data. Please try again later.</div>}
        {!gridLoadError && !isLoading && !gameOver && (
          <button
            className="unselected-tab mt-4"
            onClick={() => {
              async function endGameAndGetStats() {
                await endGameForGrid(gridId, scoreId);
                await updateStatsForGrid(gridId);
              }

              // Tell the backend this game is over
              endGameAndGetStats();

              // End the game locally
              endGame();
            }}
          >
            Give up
          </button>
        )}

        {!gridLoadError && !isLoading && gameOver && <TabBar tabs={tabInfo} />}

        {!gridLoadError && !isLoading && (
          <div className="grid-parent w-full grow p-4">
            <Grid gridDisplayData={gridDisplayData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
