import React from "react";

import "../grid.css";
import { AnyGridDisplayData } from "../gridDisplayData";
import GridSquare from "./GridSquare";

interface GridProps {
  gridDisplayData: AnyGridDisplayData[][];
}

// NOTE: If you ever want to show a differently sized grid, you need to add the
// corresponding `grid-cols-${size}` and `grid-rows-${size}` classes to
// tailwind.config.js in the safelist.
const Grid: React.FC<GridProps> = ({ gridDisplayData }) => {
  const size = gridDisplayData.length;

  return (
    <div className={`grid-container aspect-[2/3] grid grid-cols-${size} grid-rows-${size} mx-auto`}>
      {gridDisplayData.flat().map((square, index) => (
        <GridSquare key={index} {...square} row={Math.floor(index / size)} col={index % size} />
      ))}
    </div>
  );
};

export default Grid;
