import React from 'react';
import Square from './Square';

const Grid: React.FC = () => {
  const size = 3;
  const squares = [];
  for (let rowIndex = 0; rowIndex < size; rowIndex++) {
    for (let columnIndex = 0; columnIndex < size; columnIndex++) {
      const isTopLeft = rowIndex === 0 && columnIndex === 0;
      const isTopRight = rowIndex === 0 && columnIndex === size - 1;
      const isBottomLeft = rowIndex === size - 1 && columnIndex === 0;
      const isBottomRight = rowIndex === size - 1 && columnIndex === size - 1;

      let cornerClasses = '';
      if (isTopLeft) cornerClasses = 'rounded-tl';
      if (isTopRight) cornerClasses = 'rounded-tr';
      if (isBottomLeft) cornerClasses = 'rounded-bl';
      if (isBottomRight) cornerClasses = 'rounded-br';

      squares.push(
        <div className={`border ${cornerClasses} w-24 h-24`} key={`${rowIndex}-${columnIndex}`}>
          <Square initialRow={rowIndex} initialColumn={columnIndex} />
        </div>
      );
    }
  }

  return (
    <div className="grid grid-cols-3 gap-0 w-auto m-0 p-0" style={{ width: "18rem", height: "18rem" }}>
      {squares}
    </div>
  );
};

export default Grid;
