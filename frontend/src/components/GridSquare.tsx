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

  return <div className="w-full h-full border border-slate-900">{inner}</div>;
};

export default GridSquare;
