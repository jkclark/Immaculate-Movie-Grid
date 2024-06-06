import React from "react";
import { AnyGridDisplayData } from "../gridDisplayData";
import GridSquare from "./GridSquare";

interface GridProps {
  gridDisplayData: AnyGridDisplayData[][];
  selectedRow: number;
  selectedCol: number;
  gameOver: boolean;
}

const Grid: React.FC<GridProps> = ({ gridDisplayData, selectedRow, selectedCol, gameOver }) => {
  // 4 x 4 grid
  const numPages = gridDisplayData.length / 4 ** 2;
  const [currentPage, setCurrentPage] = React.useState(0);
  const gridDisplayDataPage = gridDisplayData.slice(currentPage * 4 ** 2, (currentPage + 1) * 4 ** 2);
  return (
    <div>
      {numPages > 1 && (
        <div className="flex justify-between">
          <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 0}>
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= gridDisplayData.length - 1}
          >
            Next
          </button>
        </div>
      )}
      <div
        className="grid grid-cols-4 grid-rows-4 max-w-[60vh] px-4"
        style={{ marginTop: "calc(2vh + 20px)" }}
      >
        {/* As a 2D array, this does not render properly */}
        {gridDisplayDataPage.flat().map((square, index) => (
          <GridSquare
            key={index}
            {...square}
            {...{ selectedRow, selectedCol, gameOver }}
            row={Math.floor(index / 4)}
            col={index % 4}
          />
        ))}
      </div>
    </div>
  );
};

export default Grid;
