import { Grid as GridData } from '../../common/src/interfaces';
import { BASE_S3_IMAGE_URL } from "./constants";
import { GridDisplayData } from "./interfaces";

export function getInitialGridDisplayData(gridData: GridData): GridDisplayData[][] {
  const gridSize = gridData.actors.length / 2;
  const displayData: GridDisplayData[][] = [];
  for (let rowIndex = 0; rowIndex < gridSize + 1; rowIndex++) {
    displayData.push([])
    for (let colIndex = 0; colIndex < gridSize + 1; colIndex++) {
      if (rowIndex === 0 && colIndex !== 0) {
        const actorIndex = colIndex - 1;
        displayData[rowIndex].push({
          text: gridData.actors[actorIndex].name,
          imageURL: `${BASE_S3_IMAGE_URL}/actors/${gridData.actors[actorIndex].id}.jpg`
        });
      } else if (colIndex === 0 && rowIndex !== 0) {
        const actorIndex = gridSize + rowIndex - 1;
        displayData[rowIndex].push({
          text: gridData.actors[actorIndex].name,
          imageURL: `${BASE_S3_IMAGE_URL}/actors/${gridData.actors[actorIndex].id}.jpg`
        });
      } else {
        displayData[rowIndex].push({
          text: "",
          imageURL: ""
        });
      }
    }
  }

  return displayData;
}

export function insertGridDisplayDatumAtRowCol(
  newGridDisplayDatum: GridDisplayData,
  rowIndex: number,
  colIndex: number,
  gridDisplayData: GridDisplayData[][]
): GridDisplayData[][] {
  const newGridDisplayData = [...gridDisplayData];
  newGridDisplayData[rowIndex][colIndex] = newGridDisplayDatum;
  return newGridDisplayData;
}

export function insertInnerGridDisplayData(gridDisplayData: GridDisplayData[][], innerGridDisplayData: GridDisplayData[][]): GridDisplayData[][] {
  const newGridDisplayData = [...gridDisplayData];
  for (let rowIndex = 0; rowIndex < innerGridDisplayData.length; rowIndex++) {
    for (let colIndex = 0; colIndex < innerGridDisplayData[rowIndex].length; colIndex++) {
      // 1 + rowIndex and 1 + colIndex because the inner grid starts at (1, 1) in the outer grid
      insertGridDisplayDatumAtRowCol(
        innerGridDisplayData[rowIndex][colIndex],
        1 + rowIndex,
        1 + colIndex,
        newGridDisplayData);
    }
  }
  return newGridDisplayData;
}


