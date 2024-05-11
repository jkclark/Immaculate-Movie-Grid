import React from 'react';
import Square from './Square';

const Grid: React.FC = () => {
  const squares = [];
  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    for (let columnIndex = 0; columnIndex < 3; columnIndex++) {
      squares.push(
        <div className="m-1" key={`${rowIndex}-${columnIndex}`}>
          <Square initialRow={rowIndex} initialColumn={columnIndex} />
        </div>
      );
    }
  }

  return (
    <div className="grid grid-cols-3 justify-items-center">
      {squares}
    </div>
  );
};

export default Grid;
