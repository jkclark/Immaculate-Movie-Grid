import React from 'react';
import Square from './Square';
import { Grid as GridData } from '../../../common/interfaces';

const Grid: React.FC<GridData> = gridData => {
  console.log("Grid data:");
  console.log(gridData);
  const size = 4;
  const squares = [];

  if (!gridData || !gridData.actors || gridData.actors.length === 0) {
    console.log("No actors in grid data");
    return <div></div>;
  }

  for (let rowIndex = 0; rowIndex < size; rowIndex++) {
    for (let columnIndex = 0; columnIndex < size; columnIndex++) {
      const isAxisSquare = rowIndex === 0 || columnIndex === 0;
      let squareText = "";
      if (isAxisSquare) {
        if (rowIndex === 0 && columnIndex === 0) {
        } else if (rowIndex === 0) {
          squareText = gridData.actors[columnIndex - 1].name;
        } else {
          squareText = gridData.actors[(size - 1) + (rowIndex - 1)].name;
        }
      }
      squares.push(
        <div className={`${isAxisSquare ? "" : "border solid hover:bg-sky-100"} w-18 h-18`} key={`${rowIndex}-${columnIndex}`}>
          <Square initialRow={rowIndex} initialColumn={columnIndex} text={squareText} />

        </div>
      );
    }
  }

  return (
    <div className="grid grid-cols-4 gap-0 w-auto m-0 p-0" style={{ width: "30rem", height: "30rem" }}>
      {squares}
    </div>
  );
};

export default Grid;
