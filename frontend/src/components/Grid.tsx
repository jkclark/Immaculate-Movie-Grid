import React from 'react';
import Square from './Square';
import { Grid as GridData } from '../../../common/src/interfaces';

interface GridProps {
  gridData: GridData;
  setSelectedRow: (row: number) => void;
  setSelectedCol: (col: number) => void;
}

const Grid: React.FC<GridProps> = ({ gridData, setSelectedRow, setSelectedCol }) => {
  const size = 4;
  const squares = [];

  if (!gridData || !gridData.actors || gridData.actors.length === 0) {
    console.log("No actors in grid data");
    return <div></div>;
  }

  const BASE_S3_IMAGE_URL = "https://immaculate-movie-grid-images.s3.amazonaws.com";

  // The -1 everywhere is because the first row and column are for the axis labels
  for (let rowIndex = 0; rowIndex < size; rowIndex++) {
    for (let colIndex = 0; colIndex < size; colIndex++) {
      const isAxisSquare = rowIndex === 0 || colIndex === 0;
      let squareImageURL = "";
      let squareText = "";
      let squareSetRowFunc = setSelectedRow;
      let squareSetColFunc = setSelectedCol;
      if (isAxisSquare) {
        // Axis squares should not be clickable
        squareSetRowFunc = () => { };
        squareSetColFunc = () => { };

        if (rowIndex === 0 && colIndex === 0) {
        } else if (rowIndex === 0) {
          squareText = gridData.actors[colIndex - 1].name;
          squareImageURL = `${BASE_S3_IMAGE_URL}/actors/${gridData.actors[colIndex - 1].id}.jpg`;
        } else {
          squareText = gridData.actors[(size - 1) + (rowIndex - 1)].name;
          squareImageURL = `${BASE_S3_IMAGE_URL}/actors/${gridData.actors[(size - 1) + (rowIndex - 1)].id}.jpg`;
        }
      }
      squares.push(
        <div className={`${isAxisSquare ? "" : "border solid hover:bg-sky-100 hover:cursor-pointer"}`} key={`${rowIndex}-${colIndex}`}>
          <Square row={rowIndex - 1} col={colIndex - 1} text={squareText} imageURL={squareImageURL} setSelectedRow={squareSetRowFunc} setSelectedCol={squareSetColFunc} />
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
