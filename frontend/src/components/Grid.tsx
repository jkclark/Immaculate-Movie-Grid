import React from 'react';
import Square from './Square';
import { Grid as GridData } from '../../../common/interfaces';

const Grid: React.FC<GridData> = poopyGridData => {
  console.log("Grid data:");
  console.log(poopyGridData);
  const size = 3;
  const squares = [];

  for (let rowIndex = 0; rowIndex < size; rowIndex++) {
    for (let columnIndex = 0; columnIndex < size; columnIndex++) {
      squares.push(
        <div className={`border solid w-18 h-18 hover:bg-sky-100`} key={`${rowIndex}-${columnIndex}`}>
          <Square initialRow={rowIndex} initialColumn={columnIndex} text={""} />
        </div>
      );
    }
  }

  return (
    <div className="grid grid-cols-3 gap-0 w-auto m-0 p-0" style={{ width: "30rem", height: "30rem" }}>
      {squares}
    </div>
  );
};

export default Grid;
