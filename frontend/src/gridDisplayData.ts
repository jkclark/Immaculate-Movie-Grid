import { Grid as GridData } from '../../common/src/interfaces';
import { BASE_S3_IMAGE_URL } from "./constants";

interface GridDisplayData {
  clickHandler?: () => void,
};

export interface TextGridDisplayData extends GridDisplayData {
  mainText: string,
  subText?: string,
};

export interface ImageGridDisplayData extends GridDisplayData {
  imageURL: string,
  hoverText: string,
};

export type TextOrImageGridDisplayData = TextGridDisplayData | ImageGridDisplayData;

export function getInitialGridDisplayData(gridData: GridData): TextOrImageGridDisplayData[][] {
  const gridSize = gridData.actors.length / 2;
  const displayData: TextOrImageGridDisplayData[][] = [];
  for (let rowIndex = 0; rowIndex < gridSize + 1; rowIndex++) {
    displayData.push([])
    for (let colIndex = 0; colIndex < gridSize + 1; colIndex++) {
      if (rowIndex === 0 && colIndex !== 0) {
        const actorIndex = colIndex - 1;
        displayData[rowIndex].push({
          hoverText: gridData.actors[actorIndex].name,
          imageURL: `${BASE_S3_IMAGE_URL}/actors/${gridData.actors[actorIndex].id}.jpg`
        });
      } else if (colIndex === 0 && rowIndex !== 0) {
        const actorIndex = gridSize + rowIndex - 1;
        displayData[rowIndex].push({
          hoverText: gridData.actors[actorIndex].name,
          imageURL: `${BASE_S3_IMAGE_URL}/actors/${gridData.actors[actorIndex].id}.jpg`
        });
      } else {
        displayData[rowIndex].push({
          hoverText: "",
          imageURL: ""
        });
      }
    }
  }

  return displayData;
}

export function insertGridDisplayDatumAtRowCol(
  newGridDisplayDatum: TextOrImageGridDisplayData,
  rowIndex: number,
  colIndex: number,
  gridDisplayData: TextOrImageGridDisplayData[][]
): TextOrImageGridDisplayData[][] {
  const newGridDisplayData = [...gridDisplayData];
  newGridDisplayData[rowIndex][colIndex] = newGridDisplayDatum;
  return newGridDisplayData;
}

export function insertInnerGridDisplayData(
  gridDisplayData: TextOrImageGridDisplayData[][],
  innerGridDisplayData: TextOrImageGridDisplayData[][]
): TextOrImageGridDisplayData[][] {
  let newGridDisplayData = [...gridDisplayData];
  for (let rowIndex = 0; rowIndex < innerGridDisplayData.length; rowIndex++) {
    for (let colIndex = 0; colIndex < innerGridDisplayData[rowIndex].length; colIndex++) {
      // 1 + rowIndex and 1 + colIndex because the inner grid starts at (1, 1) in the outer grid
      newGridDisplayData = insertGridDisplayDatumAtRowCol(
        innerGridDisplayData[rowIndex][colIndex],
        1 + rowIndex,
        1 + colIndex,
        newGridDisplayData);
    }
  }
  return newGridDisplayData;
}
