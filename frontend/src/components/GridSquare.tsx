import React from "react";
import EmptyGameSquare from "./EmptyGameSquare";
import ImageSquare from "./ImageSquare";
import TextSquare from "./TextSquare";

interface GridSquare {
  imageURL?: string;
  hoverText?: string;
  mainText?: string;
  subText?: string;
  clickHandler?: () => void;
  row: number;
  col: number;
}

const GridSquare: React.FC<GridSquare> = ({
  imageURL,
  hoverText,
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
    inner = <ImageSquare {...{ imageURL }} hoverText={hoverText || ""} />;
  } else {
    inner = <EmptyGameSquare clickHandler={stopPropClickHandler} {...{ row, col }} />;
  }

  return <div className="border border-slate-900">{inner}</div>;
};

export default GridSquare;
