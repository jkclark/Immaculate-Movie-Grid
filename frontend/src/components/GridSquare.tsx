import React from "react";
import EmptyGameSquare from "./EmptyGameSquare";
import ImageSquare from "./ImageSquare";
import TextSquare from "./TextSquare";

interface GridSquareProps {
  imageURL?: string;
  hoverText?: string;
  backupImageURL?: string;
  mainText?: string;
  subText?: string;
  clickHandler?: () => void;
  // Show text in the top right corner of the square if present
  cornerText?: string;
  cursor?: "pointer";
  // Border color utility for the square
  border?: string;
  // Show a "gradient" from the bottom of the square to the `backgroundGradientHeight` % of the way up
  backgroundGradientHeight?: number;
  row: number;
  col: number;
}

const GridSquare: React.FC<GridSquareProps> = ({
  imageURL,
  hoverText,
  backupImageURL,
  mainText,
  subText,
  clickHandler,
  cornerText,
  cursor,
  border,
  backgroundGradientHeight,
  row,
  col,
}) => {
  function stopPropClickHandler(event: React.MouseEvent) {
    // Necessary to prevent the page's click handler from resetting this state
    event.stopPropagation();

    if (clickHandler) {
      clickHandler();
    }
  }

  let inner: JSX.Element;

  if (mainText) {
    inner = <TextSquare {...{ mainText, subText, clickHandler }} />;
  } else if (imageURL) {
    if (backupImageURL) {
      inner = <ImageSquare {...{ imageURL, backupImageURL }} hoverText={hoverText || ""} />;
    } else {
      console.error("This should not be allowed. I really need to better define my types...");
      inner = <ImageSquare {...{ imageURL }} hoverText={hoverText || ""} backupImageURL="" />;
    }
  } else {
    inner = <EmptyGameSquare clickHandler={stopPropClickHandler} {...{ row, col }} />;
  }

  // Don't show borders on the top and left edges of the grid
  const isAxisSquare = col == 0 || row == 0;

  return (
    <div
      className={`relative w-full h-full ${!isAxisSquare && "border"} ${border ? border : "border-theme-light-secondary dark:border-theme-dark-secondary"} ${cursor === "pointer" && "hover:cursor-pointer"}`}
    >
      {inner}
      {cornerText && (
        <div className="absolute top-0 right-0 rounded-bl-sm bg-gray-600/80 p-1">{cornerText}</div>
      )}
      {backgroundGradientHeight && backgroundGradientHeight > 0 && (
        <div
          className="z-0 absolute bottom-0 left-0 w-full bg-theme-secondary"
          style={{ height: `${backgroundGradientHeight}%` }}
        />
      )}
    </div>
  );
};

export default GridSquare;
