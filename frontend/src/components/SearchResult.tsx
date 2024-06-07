import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";
import { Grid as GridData, SearchResult as SearchResultData } from "../../../common/src/interfaces";
import {
  getGuessesRemainingGridDatum,
  gridDisplayDataAtom,
  insertGridDisplayDatumAtRowCol,
} from "../gridDisplayData";
import { getS3BackupImageURLForType, getS3ImageURLForType } from "../s3";
import {
  gridDataAtom,
  guessesRemainingAtom,
  selectedColAtom,
  selectedRowAtom,
  usedAnswersAtom,
} from "../state";
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
  const [gridDisplayData, setGridDisplayData] = useAtom(gridDisplayDataAtom);
  const { resetOverlayContents } = useOverlayStack();
  const [isWrong, setIsWrong] = useState(false);

  function handleClick(event: React.MouseEvent) {
    event.preventDefault(); // For whatever reason the button refreshes the page without this
    if (checkAnswer(media_type, id, gridData)) {
      addAnswerToGridDisplayData(media_type, id, title);
      resetOverlayContents();
    } else {
      setIsWrong(true);
    }
  }

  function checkAnswer(type: "movie" | "tv", id: number, gridData: GridData): boolean {
    if (selectedRow === -1 || selectedCol === -1) {
      throw new Error("Selected row or column is -1");
    }

    // - 1 because the first row and column are the axes
    const dataRow = selectedRow - 1;
    const dataCol = selectedCol - 1;

    const acrossActorId = gridData.actors[dataCol].id;
    const downActorId = gridData.actors[3 + dataRow].id;
    const acrossCorrect = gridData.answers[acrossActorId].some(
      (answer) => answer.type === type && answer.id === id
    );
    const downCorrect = gridData.answers[downActorId].some(
      (answer) => answer.type === type && answer.id === id
    );

    // -1 guesses remaining
    updateGuessesRemaining(guessesRemaining - 1);

    if (acrossCorrect && downCorrect) {
      console.log("Correct!");
      // Add this answer to used answers
      setUsedAnswers([...usedAnswers, { type, id }]);

      // Reset selected row and column
      setSelectedRow(-1);
      setSelectedCol(-1);
      return true;
    } else {
      console.log("Wrong!");
      return false;
    }
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
