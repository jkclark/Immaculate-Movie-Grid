import React from "react";
import BlankSquare from "./BlankSquare";
import ImageSquare from "./ImageSquare";
import TextSquare from "./TextSquare";

interface GridSquare {
  imageURL?: string;
  hoverText?: string;
  mainText?: string;
  subText?: string;
  clickHandler?: () => void;
}

const GridSquare: React.FC<GridSquare> = ({
  imageURL,
  hoverText,
  mainText,
  subText,
  clickHandler,
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
    inner = <TextSquare {...{ mainText, subText }} />;
  }

  else if (imageURL) {
    inner = <ImageSquare {...{ imageURL }} hoverText={hoverText || ""} />;
  }

  else {
    inner = <BlankSquare clickHandler={stopPropClickHandler} />;
  }

  return (
    <div className="border border-slate-900">
      {inner}
    </div>
  );
};

export default GridSquare;
