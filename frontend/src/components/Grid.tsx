import React from 'react';
import { ImageGridDisplayData, TextGridDisplayData } from '../gridDisplayData';
import GridSquare from './GridSquare';

interface GridProps {
  gridDisplayData: (ImageGridDisplayData | TextGridDisplayData)[][];
}

const Grid: React.FC<GridProps> = ({ gridDisplayData: gridData }) => {
  return (
    <div className="grid grid-cols-4 grid-rows-4 max-w-[60vh] px-4" style={{ marginTop: "calc(2vh + 20px)" }}>
      {/* As a 2D array, this does not render properly */}
      {gridData.flat().map((square, index) => (
        <GridSquare key={index} {...square} />
      ))}
    </div>
  );
};

export default Grid;
