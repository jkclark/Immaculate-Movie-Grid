import React, { useEffect } from 'react';
import Square from './Square';
import { GridDisplayData } from '../gridDisplayData';

interface GridProps {
  gridDisplayData: GridDisplayData[][];
}

const Grid: React.FC<GridProps> = ({ gridDisplayData: gridData }) => {
  const [squares, setSquares] = React.useState<JSX.Element[]>([]);

  useEffect(() => {
    if (!gridData || !gridData.length || !gridData[0].length) {
      console.log("No grid data");
      return;
    }

    const size = gridData[0].length;;
    const newSquares: JSX.Element[] = [];

    for (let rowIndex = 0; rowIndex < size; rowIndex++) {
      for (let colIndex = 0; colIndex < size; colIndex++) {
        const gridDatum = gridData[rowIndex][colIndex];
        newSquares.push(
          <div className="border" key={`${rowIndex}- ${colIndex}`}>
            <Square
              text={gridDatum.text}
              imageURL={gridDatum.imageURL}
              div={gridDatum.div}
              clickHandler={gridDatum.clickHandler}
            />
          </div>
        );
      }
    }

    setSquares(newSquares);
  }, [gridData]);

  return (
    <div className="grid grid-cols-4 grid-rows-4 max-w-[60vh] px-4" style={{ marginTop: "calc(2vh + 20px)" }}>
      {squares}
    </div>
  );
};

export default Grid;
