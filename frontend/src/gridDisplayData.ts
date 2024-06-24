import { atomWithStorage } from "jotai/utils";
import { GridExport } from "../../common/src/interfaces";
import { getS3BackupImageURLForType, getS3ImageURLForType } from "./s3";

interface GridDisplayData {
  clickHandler?: () => void;
}

export const gridDisplayDataAtom = atomWithStorage("gridDisplayData", [[]] as AnyGridDisplayData[][]);

export interface TextGridDisplayData extends GridDisplayData {
  mainText: string;
  subText?: string;
}

export interface ImageGridDisplayData extends GridDisplayData {
  imageURL: string;
  hoverText: string;
  backupImageURL: string;
}

export type AnyGridDisplayData = GridDisplayData | TextGridDisplayData | ImageGridDisplayData;

export function getInitialGridDisplayData(gridData: GridExport): AnyGridDisplayData[][] {
  const gridSize = gridData.actors.length / 2;
  const displayData: AnyGridDisplayData[][] = [];
  for (let rowIndex = 0; rowIndex < gridSize + 1; rowIndex++) {
    displayData.push([]);
    for (let colIndex = 0; colIndex < gridSize + 1; colIndex++) {
      if (rowIndex === 0 && colIndex !== 0) {
        const actorIndex = colIndex - 1;
        displayData[rowIndex].push({
          hoverText: gridData.actors[actorIndex].name,
          imageURL: getS3ImageURLForType("actor", gridData.actors[actorIndex].id),
          backupImageURL: getS3BackupImageURLForType("actor"),
        });
      } else if (colIndex === 0 && rowIndex !== 0) {
        const actorIndex = gridSize + rowIndex - 1;
        displayData[rowIndex].push({
          hoverText: gridData.actors[actorIndex].name,
          imageURL: getS3ImageURLForType("actor", gridData.actors[actorIndex].id),
          backupImageURL: getS3BackupImageURLForType("actor"),
        });
      } else {
        displayData[rowIndex].push({});
      }
    }
  }

  return displayData;
}

export function insertGridDisplayDatumAtRowCol(
  newGridDisplayDatum: AnyGridDisplayData,
  rowIndex: number,
  colIndex: number,
  gridDisplayData: AnyGridDisplayData[][]
): AnyGridDisplayData[][] {
  const newGridDisplayData = [...gridDisplayData];
  newGridDisplayData[rowIndex][colIndex] = newGridDisplayDatum;
  return newGridDisplayData;
}

export function insertInnerGridDisplayData(
  gridDisplayData: AnyGridDisplayData[][],
  innerGridDisplayData: AnyGridDisplayData[][]
): AnyGridDisplayData[][] {
  let newGridDisplayData = [...gridDisplayData];
  for (let rowIndex = 0; rowIndex < innerGridDisplayData.length; rowIndex++) {
    for (let colIndex = 0; colIndex < innerGridDisplayData[rowIndex].length; colIndex++) {
      // 1 + rowIndex and 1 + colIndex because the inner grid starts at (1, 1) in the outer grid
      newGridDisplayData = insertGridDisplayDatumAtRowCol(
        innerGridDisplayData[rowIndex][colIndex],
        1 + rowIndex,
        1 + colIndex,
        newGridDisplayData
      );
    }
  }
  return newGridDisplayData;
}

export function getGuessesRemainingGridDatum(newGuessesRemaining: number): AnyGridDisplayData {
  return {
    mainText: `${newGuessesRemaining}`,
    subText: "guesses left",
  };
}
