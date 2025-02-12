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
    // Width & height managed in grid.css
    <div className={`grid-container aspect-square mx-auto`}>
      {gridDisplayData.flat().map((square, index) => {
        // The gaps in the grid are between the 1st and 2nd columns and rows,
        // so we need to adjust the column and row indices accordingly
        const colIndex = (index % size) + 1;
        const adjustedColIndex = colIndex >= 2 ? colIndex + 1 : colIndex;

        const rowIndex = Math.floor(index / size) + 1;
        const adjustedRowIndex = rowIndex >= 2 ? rowIndex + 1 : rowIndex;

        return (
          <div
            key={index}
            style={{
              gridColumn: adjustedColIndex,
              gridRow: adjustedRowIndex,
            }}
          >
            <GridSquare
              key={index}
              {...square}
              row={Math.floor(index / size)}
              col={index % size}
              gridSize={size}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Grid;
