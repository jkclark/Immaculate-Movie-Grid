import React from "react";
import { AnyGridDisplayData } from "../gridDisplayData";
import GridSquare from "./GridSquare";

interface GridProps {
  gridDisplayData: AnyGridDisplayData[][];
}

const Grid: React.FC<GridProps> = ({ gridDisplayData }) => {
  return (
    <div>
      <div
        className="grid grid-cols-4 grid-rows-4 max-w-[60vh] px-4"
        style={{ marginTop: "calc(2vh + 20px)" }}
      >
        {gridDisplayData.flat().map((square, index) => (
          <GridSquare key={index} {...square} row={Math.floor(index / 4)} col={index % 4} />
        ))}
      </div>
    </div>
  );
};

export default Grid;
