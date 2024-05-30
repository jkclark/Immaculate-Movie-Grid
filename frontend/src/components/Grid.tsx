import React from "react";
import { AnyGridDisplayData } from "../gridDisplayData";
import GridSquare from "./GridSquare";

interface GridProps {
  gridDisplayData: AnyGridDisplayData[][];
  selectedRow: number;
  selectedCol: number;
}

const Grid: React.FC<GridProps> = ({ gridDisplayData: gridData, selectedRow, selectedCol }) => {
  console.log("Selected row and col: ", selectedRow, selectedCol);
  return (
    <div className="grid grid-cols-4 grid-rows-4 max-w-[60vh] px-4" style={{ marginTop: "calc(2vh + 20px)" }}>
      {/* As a 2D array, this does not render properly */}
      {gridData.flat().map((square, index) => (
        <GridSquare
          key={index}
          {...square}
          {...{ selectedRow, selectedCol }}
          row={Math.floor(index / 4)}
          col={index % 4}
        />
      ))}
    </div>
  );
};

export default Grid;
