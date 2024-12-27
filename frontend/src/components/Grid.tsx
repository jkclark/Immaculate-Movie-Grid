import React from "react";

import "../grid.css";
import { AnyGridDisplayData } from "../gridDisplayData";
import GridSquare from "./GridSquare";

interface GridProps {
  size: number;
  gridDisplayData: AnyGridDisplayData[][];
}

// NOTE: If you ever want to pass in a new value to the Grid's size param,
// you need to add the corresponding `grid-cols-${size}` and `grid-rows-${size}`
// classes to tailwind.config.js in the safelist.
const Grid: React.FC<GridProps> = ({ gridDisplayData, size }) => {
  return (
    <div className={`grid-container aspect-[2/3] grid grid-cols-${size} grid-rows-${size} mx-auto`}>
      {gridDisplayData.flat().map((square, index) => (
        <GridSquare key={index} {...square} row={Math.floor(index / size)} col={index % size} />
      ))}
    </div>
  );
};

export default Grid;
