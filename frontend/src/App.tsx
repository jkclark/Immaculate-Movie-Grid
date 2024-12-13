import { useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import { ActorExport, CategoryExport, CreditExport, GridExport } from "common/src/interfaces";
import CorrectCreditsSummary from "./components/CorrectCreditsSummary";
import Grid from "./components/Grid";
import Navbar from "./components/Navbar";
import Overlay, { useOverlayStack } from "./components/Overlay";
import SearchBar from "./components/SearchBar";
import { ALL_ANSWERS_TAB_TEXT, OVERALL_STATS_TAB_TEXT, YOUR_ANSWERS_TAB_TEXT } from "./constants";
import {
  AnyGridDisplayData,
  TextGridDisplayData,
  getBlankGridDisplayData,
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
import { endGameForGrid, getStatsForGrid } from "./stats";

function App() {
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [gridId, setGridId] = useAtom(gridIdAtom);
  const [isNewGrid, setIsNewGrid] = useState(false);
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
  const [gameOver, setGameOver] = useAtom(gameOverAtom);
  const [finalGameGridDisplayData, setFinalGameGridDisplayData] = useAtom(finalGameGridDisplayDataAtom);
  const [gridStats, setGridStats] = useAtom(gridStatsAtom);

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

        // Set isNewGrid to true so we know to set up the initial grid display data
        setIsNewGrid(true);

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

  // Once we've loaded the grid data, populate the grid display data
  useEffect(() => {
    console.log("Grid data", gridData);
    if (Object.keys(gridData).length === 0) {
      return;
    }

    setGridDisplayData(getInitialGameGridDisplayData(isNewGrid ? true : false));

    setIsLoading(false);
  }, [gridData]);

  // End the game if there are no guesses remaining
  useEffect(() => {
    if (guessesRemaining <= 0) {
      // Remember, the backend is notified of the game being over
      // by receiving the 9th guess, which is the maximum number of guesses
      // allowed
      endGame(gridDisplayData);
    }
  }, [guessesRemaining]);

  // Get the grid's stats now, and then periodically
  useEffect(() => {
    const fetchStats = async () => {
      if (!gridId) {
        return;
      }

      setGridStats(await getStatsForGrid(gridId));
    };

    // Fetch stats immediately
    fetchStats();

    // Set up interval to fetch stats periodically
    const GET_STATS_INTERVAL = 30000;
    const interval = setInterval(fetchStats, GET_STATS_INTERVAL);

    return () => clearInterval(interval);
  }, [gridId]);

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
   * @param fresh whether or not to include usedAnswers from localstorage
   * @returns a 2D array of AnyGridDisplayData representing the initial game grid
   */
  function getInitialGameGridDisplayData(fresh: boolean): AnyGridDisplayData[][] {
    const newInnerGridData: AnyGridDisplayData[][] = [];

    // Create squares for inner grid
    for (let rowIndex = 0; rowIndex < gridData.axes.length / 2; rowIndex++) {
      const innerGridRow: AnyGridDisplayData[] = [];
      for (let colIndex = 0; colIndex < gridData.axes.length / 2; colIndex++) {
        // We're restoring usedAnswers from localstorage
        if (!fresh && usedAnswers[getRowColKey(rowIndex, colIndex)]) {
          console.log(`Restoring used answer for row ${rowIndex} and col ${colIndex}`);
          const { type, id, name } = usedAnswers[getRowColKey(rowIndex, colIndex)];
          innerGridRow.push({
            hoverText: name,
            imageURL: getS3ImageURLForType(type, id),
            backupImageURL: getS3BackupImageURLForType(type),
          });
        }

        // We're starting fresh
        else {
          innerGridRow.push({
            clickHandler: () => {
              if (!gameOver) {
                setSelectedRow(rowIndex + 1);
                setSelectedCol(colIndex + 1);
                addContentsToOverlay(<SearchBar />);
              }
            },
          });
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
    setFinalGameGridDisplayData([]);
    setGridStats({});
  }

  function endGame(gridDisplayData: AnyGridDisplayData[][]) {
    setFinalGameGridDisplayData(gridDisplayData);
    setGameOver(true);
    setSelectedRow(-1);
    setSelectedCol(-1);

    // Make sure to hide the search bar and search results if the last guess
    // is an incorrect one
    resetOverlayContents();
  }

  function getAllAnswerGridDisplayData(): AnyGridDisplayData[][] {
    const newInnerGridData: TextGridDisplayData[][] = [];
    const acrossAxisEntities = gridData.axes.slice(0, gridData.axes.length / 2);
    const downAxisEntities = gridData.axes.slice(gridData.axes.length / 2);
    for (const downAxisEntityString of downAxisEntities) {
      const innerGridRow: TextGridDisplayData[] = [];
      for (const acrossAxisEntityString of acrossAxisEntities) {
        const [acrossAxisEntityType, acrossAxisEntityId] = acrossAxisEntityString.split("-");
        const acrossAxisEntity =
          acrossAxisEntityType === "actor"
            ? getAxisEntityFromListById(gridData.actors, parseInt(acrossAxisEntityId))
            : getAxisEntityFromListById(gridData.categories, -1 * parseInt(acrossAxisEntityId));

        const [downAxisEntityType, downAxisEntityId] = downAxisEntityString.split("-");
        const downAxisEntity =
          downAxisEntityType === "actor"
            ? getAxisEntityFromListById(gridData.actors, parseInt(downAxisEntityId))
            : getAxisEntityFromListById(gridData.categories, -1 * parseInt(downAxisEntityId));

        const answers = getAnswersForPair(acrossAxisEntity.id, downAxisEntity.id);
        const answerText = `${answers.length}`;
        innerGridRow.push({
          mainText: answerText,
          clickHandler: () => {
            addContentsToOverlay(<CorrectCreditsSummary credits={answers} />);
          },
        });
      }
      newInnerGridData.push(innerGridRow);
    }

    // Get grid data with axes populated
    const newGridData: AnyGridDisplayData[][] = getInitialGridDisplayData(gridData);

    // Replace "guesses left" with total number of answers
    const newGridDataWithTotal = insertGridDisplayDatumAtRowCol(
      {
        mainText: `${gridData.credits.length}`,
        subText: "total",
      },
      0,
      0,
      newGridData
    );
    return insertInnerGridDisplayData(newGridDataWithTotal, newInnerGridData);
  }

  function getStatsGridDisplayData(): AnyGridDisplayData[][] {
    const statsGridDisplayData = getBlankGridDisplayData(gridData.axes.length / 2);
    Object.values(gridStats).forEach((stat, index) => {
      const rowIndex = Math.floor(index / 4);
      const colIndex = index % 4;
      statsGridDisplayData[rowIndex][colIndex] = {
        mainText: stat.value.toString(),
        subText: stat.displayName,
      };
    });
    return statsGridDisplayData;
  }

  // TODO: This is copy-pasted from another file. Also we should just refactor the gridExport to be
  // objects not lists
  function getAxisEntityFromListById(
    axisEntities: (ActorExport | CategoryExport)[],
    axisEntityId: number
  ): ActorExport | CategoryExport {
    const foundAxisEntity = axisEntities.find((axisEntity) => axisEntity.id === axisEntityId);
    if (!foundAxisEntity) {
      throw new Error(`Could not find axis entity with ID ${axisEntityId}`);
    }
    return foundAxisEntity;
  }

  function getAnswersForPair(axisEntity1Id: number, axisEntity2Id: number): CreditExport[] {
    const usedTypesAndIds = new Set<string>();
    const answers: CreditExport[] = [];
    const actor1Answers = gridData.answers[axisEntity1Id];
    const actor2Answers = gridData.answers[axisEntity2Id];

    for (const actor1Answer of actor1Answers) {
      for (const actor2Answer of actor2Answers) {
        if (actor1Answer.type === actor2Answer.type && actor1Answer.id === actor2Answer.id) {
          // Skip if we've already added this credit to the answers
          if (usedTypesAndIds.has(`${actor1Answer.type}-${actor1Answer.id}`)) {
            continue;
          }

          // Look up this credit's title in the credits array
          const answer = gridData.credits.find((credit) => credit.id === actor1Answer.id);
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

  return (
    <div className="flex flex-col h-dvh dark:bg-gray-800 dark:text-white relative">
      <Navbar />

      <Overlay />

      <div className="w-full flex flex-col flex-grow items-center justify-center">
        {gridLoadError && <div>There was an error loading the grid data. Please try again later.</div>}
        {!gridLoadError && !isLoading && !gameOver && (
          <button
            onClick={() => {
              // Tell the backend this game is over
              endGameForGrid(gridId, scoreId);

              // End the game locally
              endGame(gridDisplayData);
            }}
          >
            Give up
          </button>
        )}

        {!gridLoadError && !isLoading && gameOver && (
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setActiveTab(YOUR_ANSWERS_TAB_TEXT);
                setGridDisplayData(finalGameGridDisplayData);
              }}
              className={`${activeTab === YOUR_ANSWERS_TAB_TEXT ? "bg-blue-700" : ""}`}
            >
              {YOUR_ANSWERS_TAB_TEXT}
            </button>
            <button
              onClick={() => {
                setActiveTab(ALL_ANSWERS_TAB_TEXT);
                setGridDisplayData(getAllAnswerGridDisplayData());
              }}
              className={`${activeTab === ALL_ANSWERS_TAB_TEXT ? "bg-blue-700" : ""}`}
            >
              {ALL_ANSWERS_TAB_TEXT}
            </button>
            <button
              onClick={() => {
                setActiveTab(OVERALL_STATS_TAB_TEXT);
                setGridDisplayData(getStatsGridDisplayData());
              }}
              className={`${activeTab === OVERALL_STATS_TAB_TEXT ? "bg-blue-700" : ""}`}
            >
              {OVERALL_STATS_TAB_TEXT}
            </button>
          </div>
        )}

        {!gridLoadError && !isLoading && <Grid gridDisplayData={gridDisplayData} />}
      </div>
    </div>
  );
}

export default App;
