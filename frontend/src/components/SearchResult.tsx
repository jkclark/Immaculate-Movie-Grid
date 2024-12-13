import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";

import { IncomingGuess } from "common/src/db/stats";
import {
  ActorExport,
  CategoryExport,
  GridExport as GridData,
  SearchResult as SearchResultData,
} from "common/src/interfaces";
import {
  getGuessesRemainingGridDatum,
  gridDisplayDataAtom,
  insertGridDisplayDatumAtRowCol,
} from "../gridDisplayData";
import { getS3BackupImageURLForType, getS3ImageURLForType } from "../s3";
import {
  getRowColKey,
  gridDataAtom,
  guessesRemainingAtom,
  scoreIdAtom,
  selectedColAtom,
  selectedRowAtom,
  usedAnswersAtom,
} from "../state";
import { recordGuessForGrid } from "../stats";
import { useOverlayStack } from "./Overlay";

interface SearchResultProps extends SearchResultData {
  release_year?: string;
  first_air_year?: string;
  last_air_year?: string;
}

const SearchResult: React.FC<SearchResultProps> = ({
  media_type,
  id,
  title,
  release_year,
  first_air_year,
  last_air_year,
}) => {
  const gridData = useAtomValue(gridDataAtom);
  const [selectedRow, setSelectedRow] = useAtom(selectedRowAtom);
  const [selectedCol, setSelectedCol] = useAtom(selectedColAtom);
  const [guessesRemaining, setGuessesRemaining] = useAtom(guessesRemainingAtom);
  const [usedAnswers, setUsedAnswers] = useAtom(usedAnswersAtom);
  const [scoreId, setScoreId] = useAtom(scoreIdAtom);
  const [gridDisplayData, setGridDisplayData] = useAtom(gridDisplayDataAtom);
  const { resetOverlayContents } = useOverlayStack();
  const [isWrong, setIsWrong] = useState(false);

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault(); // For whatever reason the button refreshes the page without this
    if (await checkAnswer(media_type, id, gridData)) {
      addAnswerToGridDisplayData(media_type, id, title);
      resetOverlayContents();
    } else {
      setIsWrong(true);
    }
  }

  async function checkAnswer(type: "movie" | "tv", id: number, gridData: GridData): Promise<boolean> {
    if (selectedRow === -1 || selectedCol === -1) {
      throw new Error("Selected row or column is -1");
    }

    // - 1 because the first row and column are the axes
    const dataRow = selectedRow - 1;
    const dataCol = selectedCol - 1;

    const acrossAxisEntityType = gridData.axes[dataCol].split("-")[0];
    const acrossAxisEntityId = parseInt(gridData.axes[dataCol].split("-")[1]);
    const acrossAxisEntity =
      acrossAxisEntityType === "actor"
        ? getAxisEntityFromListById(gridData.actors, acrossAxisEntityId)
        : getAxisEntityFromListById(gridData.categories, -1 * acrossAxisEntityId);
    const acrossCorrect = gridData.answers[acrossAxisEntity.id].some(
      (answer) => answer.type === type && answer.id === id
    );

    const downAxisEntityType = gridData.axes[3 + dataRow].split("-")[0];
    const downAxisEntityId = parseInt(gridData.axes[3 + dataRow].split("-")[1]);
    const downAxisEntity =
      downAxisEntityType === "actor"
        ? getAxisEntityFromListById(gridData.actors, downAxisEntityId)
        : getAxisEntityFromListById(gridData.categories, -1 * downAxisEntityId);
    const downCorrect = gridData.answers[downAxisEntity.id].some(
      (answer) => answer.type === type && answer.id === id
    );

    // -1 guesses remaining
    updateGuessesRemaining(guessesRemaining - 1);

    const correct = acrossCorrect && downCorrect;

    // Send this guess to the API
    const guessBody = {
      across_index: dataCol,
      down_index: dataRow,
      credit_id: id,
      credit_type: type,
      correct,
      score_id: scoreId,
    };

    // NOTE: We do not await here. We only care about the response from the API
    // when we need to get the new score ID, so we do that within this function only
    // when necessary. If we await here, we end up with a couple of seconds between guessing
    // and the UI updating, which obviously we don't want.
    recordGuessAndSaveScoreId(guessBody);

    if (correct) {
      console.log("Correct!");
      // Add this answer to used answers
      setUsedAnswers({ ...usedAnswers, [getRowColKey(dataRow, dataCol)]: { type, id, name: title } });

      // Reset selected row and column
      setSelectedRow(-1);
      setSelectedCol(-1);
      return true;
    } else {
      console.log("Wrong!");
      return false;
    }
  }

  async function recordGuessAndSaveScoreId(guess: IncomingGuess): Promise<void> {
    if (!scoreId) {
      const guessResponse = await recordGuessForGrid(gridData.id, guess);
      setScoreId(guessResponse.score_id);
    } else {
      recordGuessForGrid(gridData.id, guess);
    }
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

  function updateGuessesRemaining(newGuessesRemaining: number): void {
    setGridDisplayData(
      insertGridDisplayDatumAtRowCol(getGuessesRemainingGridDatum(newGuessesRemaining), 0, 0, gridDisplayData)
    );
    setGuessesRemaining(newGuessesRemaining);
  }

  function addAnswerToGridDisplayData(type: "movie" | "tv" | "actor", id: number, text: string): void {
    setGridDisplayData(
      insertGridDisplayDatumAtRowCol(
        {
          hoverText: text,
          imageURL: getS3ImageURLForType(type, id),
          backupImageURL: getS3BackupImageURLForType(type),
        },
        selectedRow,
        selectedCol,
        gridDisplayData
      )
    );
  }

  const emoji = media_type === "movie" ? "📽️" : "📺";
  const dateString = media_type === "movie" ? release_year : `${first_air_year} - ${last_air_year}`;

  return (
    <div
      className={
        "bg-gray-800 p-4 shadow-lg border border-gray-600 text-sm hover:bg-gray-700 flex justify-between items-center"
      }
    >
      <div className={`${isWrong ? "text-red-700" : "text-white"}`}>
        <span className="text-lg font-bold">{`${emoji} ${title}`}</span>
        <span className="text-sm text-gray-500 block">{`(${dateString})`}</span>
      </div>
      <button
        onClick={handleClick}
        className={`${isWrong ? "invisible" : ""} bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
      >
        Select
      </button>
    </div>
  );
};

export default SearchResult;
