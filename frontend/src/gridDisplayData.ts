import { atom } from "jotai";

import { ActorExport, CategoryExport, GridExport } from "common/src/interfaces";
import { getS3BackupImageURLForType, getS3ImageURLForType } from "./s3";

interface GridDisplayData {
  clickHandler?: () => void;
}

export const gridDisplayDataAtom = atom<AnyGridDisplayData[][]>([[]]);

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
  const gridSize = gridData.axes.length / 2;
  const displayData: AnyGridDisplayData[][] = [];
  // +1 because of the axis
  for (let rowIndex = 0; rowIndex < gridSize + 1; rowIndex++) {
    displayData.push([]);
    // +1 because of the axis
    for (let colIndex = 0; colIndex < gridSize + 1; colIndex++) {
      if (rowIndex === 0 && colIndex !== 0) {
        const axisEntityIndex = colIndex - 1;
        const [axisEntityType, axisEntityId] = gridData.axes[axisEntityIndex].split("-");
        if (axisEntityType === "actor") {
          const axisEntity = getAxisEntityFromListById(gridData.actors, parseInt(axisEntityId));
          displayData[rowIndex].push({
            hoverText: axisEntity.name,
            imageURL: getS3ImageURLForType("actor", axisEntity.id),
            backupImageURL: getS3BackupImageURLForType("actor"),
          });
        } else {
          // Remember, categories have negative IDs
          const axisEntity = getAxisEntityFromListById(gridData.categories, -1 * parseInt(axisEntityId));
          displayData[rowIndex].push({
            mainText: axisEntity.name,
          });
        }
      } else if (colIndex === 0 && rowIndex !== 0) {
        const axisEntityIndex = gridSize + rowIndex - 1;
        const [axisEntityType, axisEntityId] = gridData.axes[axisEntityIndex].split("-");
        if (axisEntityType === "actor") {
          const axisEntity = getAxisEntityFromListById(gridData.actors, parseInt(axisEntityId));
          displayData[rowIndex].push({
            hoverText: axisEntity.name,
            // The below line will break for categories at this point, but that's ok
            imageURL: getS3ImageURLForType("actor", axisEntity.id),
            backupImageURL: getS3BackupImageURLForType("actor"),
          });
        } else {
          // Remember, categories have negative IDs
          const axisEntity = getAxisEntityFromListById(gridData.categories, -1 * parseInt(axisEntityId));
          displayData[rowIndex].push({
            mainText: axisEntity.name,
          });
        }
      } else {
        displayData[rowIndex].push({});
      }
    }
  }

  return displayData;
}

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
