import React from 'react';
import Square from './Square';
import { GridDisplayData } from '../interfaces';

interface GridProps {
  gridData: GridDisplayData[][];
  selectedRow: number;
  selectedCol: number;
  setSelectedRow: (row: number) => void;
  setSelectedCol: (col: number) => void;
}

const Grid: React.FC<GridProps> = ({ gridData, selectedRow, selectedCol, setSelectedRow, setSelectedCol }) => {
  if (!gridData || !gridData.length || !gridData[0].length) {
    console.log("No grid data");
    return <div></div>;
  }

  const size = gridData[0].length;;
  const squares = [];

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
      squares.push(
        <div className={`${squareBackgroundColor} ${isAxisSquare ? "" : "border border-slate-900 solid hover:bg-sky-200 hover:cursor-pointer"}`} key={`${rowIndex}-${colIndex}`}>
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

  return (
    <div className="grid grid-cols-4 grid-rows-4 max-w-[60vh] px-4" style={{ marginTop: "calc(2vh + 20px)" }}>
      {squares}
    </div>
  );
};

export default Grid;
