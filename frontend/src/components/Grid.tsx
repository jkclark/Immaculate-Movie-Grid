import React from "react";
import { AnyGridDisplayData } from "../gridDisplayData";
import GridSquare from "./GridSquare";

interface GridProps {
  size: number;
  gridDisplayData: AnyGridDisplayData[][];
  style?: React.CSSProperties;
}

// NOTE: If you ever want to pass in a new value to the Grid's size param,
// you need to add the corresponding `grid-cols-${size}` and `grid-rows-${size}`
// classes to tailwind.config.js in the safelist.
const Grid: React.FC<GridProps> = ({ gridDisplayData, size, style }) => {
  return (
    <div className={`grid grid-cols-${size} grid-rows-${size} max-w-[60vh] w-full px-4`} style={style}>
      {gridDisplayData.flat().map((square, index) => (
        <GridSquare key={index} {...square} row={Math.floor(index / size)} col={index % size} />
      ))}
    </div>
  );
};

export default Grid;
