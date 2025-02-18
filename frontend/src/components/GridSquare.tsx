import React from "react";
import EmptyGameSquare from "./EmptyGameSquare";
import ImageSquare from "./ImageSquare";
import TextSquare from "./TextSquare";
import ToggleableImageSquare from "./ToggleableImageSquare";

interface GridSquareProps {
  imageURL?: string;
  hoverText?: string;
  backupImageURL?: string;
  mainText?: string;
  subText?: string;
  tooltipText?: JSX.Element;
  clickHandler?: () => void;
  toggleable?: boolean;
  // Show text in the top right corner of the square if present
  cornerText?: string;
  cursor?: "pointer";
  // Border color utility for the square
  border?: string;
  // Show a "gradient" from the bottom of the square to the `backgroundGradientHeight` % of the way up
  backgroundGradientHeight?: number;
  row: number;
  col: number;
  gridSize: number;
}

const GridSquare: React.FC<GridSquareProps> = ({
  imageURL,
  hoverText,
  backupImageURL,
  mainText,
  subText,
  tooltipText,
  clickHandler,
  toggleable,
  cornerText,
  cursor,
  border,
  backgroundGradientHeight,
  row,
  col,
  gridSize,
}) => {
  function stopPropClickHandler(event: React.MouseEvent) {
    // Necessary to prevent the page's click handler from resetting this state
    event.stopPropagation();

    if (clickHandler) {
      clickHandler();
    }
  }

  // Determine which, if any of the 4 corners to round
  // Remember that with axes we don't want corners for row and col 0, but rather 1
  const firstRowColIndex = 1;
  // If changed, make sure to add "rounded-{size}" class and corresponding tl, tr, bl, br classes to tailwind.config.js
  const roundednessSize = "xl";
  const allAroundRoundedCornerClassName = `rounded-${roundednessSize}`;
  let roundedCornerClassName;
  if (row == firstRowColIndex && col == firstRowColIndex) {
    roundedCornerClassName = `rounded-tl-${roundednessSize}`;
  } else if (row == firstRowColIndex && col == gridSize - 1) {
    roundedCornerClassName = `rounded-tr-${roundednessSize}`;
  } else if (row == gridSize - 1 && col == firstRowColIndex) {
    roundedCornerClassName = `rounded-bl-${roundednessSize}`;
  } else if (row == gridSize - 1 && col == gridSize - 1) {
    roundedCornerClassName = `rounded-br-${roundednessSize}`;
  }

  let inner: JSX.Element;

  // Toggleable square
  if (toggleable && mainText && imageURL && hoverText && backupImageURL) {
    inner = (
      <ToggleableImageSquare
        {...{ imageURL, hoverText, backupImageURL, mainText, subText }}
        roundednessClassName={allAroundRoundedCornerClassName}
      />
    );
  }

  // Text square
  else if (mainText) {
    inner = <TextSquare {...{ mainText, subText, tooltipText, clickHandler }} />;
  }

  // Image square
  else if (imageURL) {
    if (backupImageURL) {
      inner = <ImageSquare {...{ imageURL, backupImageURL }} hoverText={hoverText || ""} />;
    } else {
      console.error("This should not be allowed. I really need to better define my types...");
      inner = <ImageSquare {...{ imageURL }} hoverText={hoverText || ""} backupImageURL="" />;
    }
  }

  // Empty square
  else {
    inner = (
      <EmptyGameSquare
        clickHandler={stopPropClickHandler}
        {...{ row, col }}
        roundedCornerClassName={roundedCornerClassName}
      />
    );
  }

  // Don't show borders on the top and left edges of the grid
  const isAxisSquare = col == 0 || row == 0;

  const outerBorderClasses = `
    ${row === 1 && col != 0 ? "border-t-2" : ""}
    ${col === 1 && row != 0 ? "border-l-2" : ""}
    ${row === gridSize - 1 && col != 0 ? "border-b-2" : ""}
    ${col === gridSize - 1 && row != 0 ? "border-r-2" : ""}
  `;

  return (
    <div
      className={`
        relative
        w-full
        aspect-square
        ${!isAxisSquare && "border"}
        ${border ? border : "border-theme-light-secondary dark:border-theme-dark-secondary"}
        ${roundedCornerClassName}
        ${cursor === "pointer" && "hover:cursor-pointer"}
        ${outerBorderClasses}
      `}
    >
      {inner}
      {cornerText && (
        <div className="absolute top-0 right-0 rounded-bl-sm bg-gray-600/80 p-1 theme-text">{cornerText}</div>
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
