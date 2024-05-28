import React, { useEffect } from 'react';
import Square from './Square';
import { GridDisplayData } from '../interfaces';

interface GridProps {
  gridDisplayData: GridDisplayData[][];
  selectedRow: number;
  selectedCol: number;
  setSelectedRow: (row: number) => void;
  setSelectedCol: (col: number) => void;
}

const Grid: React.FC<GridProps> = ({ gridDisplayData: gridData, selectedRow, selectedCol, setSelectedRow, setSelectedCol }) => {
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
        const isAxisSquare = rowIndex === 0 || colIndex === 0;
        let squareSetRowFunc = setSelectedRow;
        let squareSetColFunc = setSelectedCol;
        let squareBackgroundColor = "";
        if (isAxisSquare) {
          // Axis squares should not be clickable
          squareSetRowFunc = () => { };
          squareSetColFunc = () => { };
        } else {
          // Set this square's background color if it's the currently selected square
          squareBackgroundColor = (rowIndex) === selectedRow && (colIndex) === selectedCol ? "bg-sky-100" : "";

          if (gridData[rowIndex][colIndex].imageURL) {
            squareSetRowFunc = () => { };
            squareSetColFunc = () => { };
          }
        }
        newSquares.push(
          <div className={`${squareBackgroundColor} ${isAxisSquare ? "" : "border border-slate-900 solid hover:bg-sky-200"} ${gridData[rowIndex][colIndex].text ? "hover:cursor-default" : "hover:cursor-pointer"}`} key={`${rowIndex}-${colIndex}`}>
            <Square
              row={rowIndex}
              col={colIndex}
              text={gridData[rowIndex][colIndex].text}
              div={gridData[rowIndex][colIndex].div}
              imageURL={gridData[rowIndex][colIndex].imageURL}
              setSelectedRow={squareSetRowFunc}
              setSelectedCol={squareSetColFunc}
            />
          </div>
        );
      }
    }

    setSquares(newSquares);
  }, [gridData, selectedRow, selectedCol]);

  return (
    <div className="grid grid-cols-4 grid-rows-4 max-w-[60vh] px-4" style={{ marginTop: "calc(2vh + 20px)" }}>
      {squares}
    </div>
  );
};

export default Grid;
