import { useEffect, useState } from "react";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { CreditExport, GridExport } from "../../common/src/interfaces";
import CorrectCreditsSummary from "./components/CorrectCreditsSummary";
import Grid from "./components/Grid";
import Navbar from "./components/Navbar";
import Overlay, { useOverlayStack } from "./components/Overlay";
import SearchBar from "./components/SearchBar";
import {
  AnyGridDisplayData,
  TextGridDisplayData,
  getGuessesRemainingGridDatum,
  getInitialGridDisplayData,
  gridDisplayDataAtom,
  insertGridDisplayDatumAtRowCol,
  insertInnerGridDisplayData,
} from "./gridDisplayData";
import { getGridDataFromS3, getS3ImageURLForType, preloadImageURL } from "./s3";
import {
  activeTabAtom,
  finalGameGridDisplayDataAtom,
  gameOverAtom,
  gridDataAtom,
  gridIdAtom,
  guessesRemainingAtom,
  selectedColAtom,
  selectedRowAtom,
} from "./state";

function App() {
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [gridId, setGridId] = useAtom(gridIdAtom);
  const [isNewGrid, setIsNewGrid] = useState(false);
  const [gridData, setGridData] = useAtom(gridDataAtom);
  const [gridDisplayData, setGridDisplayData] = useAtom(gridDisplayDataAtom);
  // This could be a set, but I think it's clearer if it's a list of objects like this
  const [isLoading, setIsLoading] = useState(true);

  const setSelectedRow = useSetAtom(selectedRowAtom);
  const setSelectedCol = useSetAtom(selectedColAtom);
  const { addContentsToOverlay } = useOverlayStack();
  const guessesRemaining = useAtomValue(guessesRemainingAtom);
  const [gameOver, setGameOver] = useAtom(gameOverAtom);
  const [finalGameGridDisplayData, setFinalGameGridDisplayData] = useAtom(finalGameGridDisplayDataAtom);

  // On page load, load the grid data
  useEffect(() => {
    async function fetchData() {
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];

      // If gridId is not set to today's date, there is (supposed to be)
      // a different grid available
      if (gridId !== todayString) {
        console.log("Grid ID is not today's date, loading grid data");
        // Load the grid named with today's date, or the backup grid if today's grid isn't available
        const jsonData = await getGridDataForDateOrBackup(todayString);

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

  useEffect(() => {
    console.log("Grid ID:", gridId);
  }, [gridId]);

  // Once we've loaded the grid data, populate the grid display data
  useEffect(() => {
    console.log("Grid data", gridData);
    if (Object.keys(gridData).length === 0) {
      return;
    }

    if (isNewGrid) {
      console.log("Setting up initial grid ajsdopif");
      setGridDisplayData(getInitialGameGridDisplayData());
    }

    setIsLoading(false);
  }, [gridData]);

  // Preload all other images once the page has loaded
  useEffect(() => {
    if (!isLoading) {
      async function preloadImages() {
        await Promise.all(
          gridData.credits.map((credit) => {
            const imageURL = getS3ImageURLForType(credit.type, credit.id);
            // Fail silently if we can't preload an image
            return preloadImageURL(imageURL).catch(() => {});
          })
        );
      }
      preloadImages();
    }
  }, [isLoading]);

  async function getGridDataForDateOrBackup(dateString: string): Promise<GridExport> {
    // Load the grid named with today's date
    let jsonData = await getGridDataFromS3("immaculate-movie-grid-daily-grids", `${dateString}.json`);

    if (Object.keys(jsonData).length === 0) {
      console.error("No grid data found for today, attempting to load backup grid");

      const BACKUP_GRID_FILENAME = "backup-grid.json";
      jsonData = await getGridDataFromS3("immaculate-movie-grid-daily-grids", BACKUP_GRID_FILENAME);

      if (Object.keys(jsonData).length === 0) {
        console.error("No backup grid found");
      }
    }

    return jsonData;
  }

  function getInitialGameGridDisplayData(): AnyGridDisplayData[][] {
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
              addContentsToOverlay(<SearchBar />);
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

  function getAllAnswerGridDisplayData(): AnyGridDisplayData[][] {
    const newInnerGridData: TextGridDisplayData[][] = [];
    const acrossActors = gridData.actors.slice(0, gridData.actors.length / 2);
    const downActors = gridData.actors.slice(gridData.actors.length / 2);
    for (const downActor of downActors) {
      const innerGridRow: TextGridDisplayData[] = [];
      for (const acrossActor of acrossActors) {
        const answers = getAnswersForPair(acrossActor.id, downActor.id);
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

  function getAnswersForPair(actor1Id: number, actor2Id: number): CreditExport[] {
    const usedTypesAndIds = new Set<string>();
    const answers: CreditExport[] = [];
    const actor1Answers = gridData.answers[actor1Id];
    const actor2Answers = gridData.answers[actor2Id];

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
    <div className="flex flex-col h-screen dark:bg-gray-800 dark:text-white relative">
      <Navbar />

      <Overlay />

      <div className="w-full flex flex-col flex-grow items-center justify-center">
        {!isLoading && !gameOver && (
          <button
            onClick={() => {
              endGame(gridDisplayData);
            }}
          >
            Give up
          </button>
        )}

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
                setGridDisplayData(getAllAnswerGridDisplayData());
              }}
              className={`${activeTab === "All answers" ? "bg-blue-700" : ""}`}
            >
              All answers
            </button>
          </div>
        )}

        <Grid gridDisplayData={gridDisplayData} />
      </div>
    </div>
  );
}

export default App;
