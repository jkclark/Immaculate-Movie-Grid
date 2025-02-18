import { useAtomValue } from "jotai";
import React from "react";

import { ActorSquareMode, actorSquareModeAtom } from "../state";
import ImageSquare, { ImageSquareProps } from "./ImageSquare";
import TextSquare, { TextSquareProps } from "./TextSquare";

type ToggleableImageSquareProps = TextSquareProps & ImageSquareProps;

const ToggleableImageSquare: React.FC<ToggleableImageSquareProps> = ({
  imageURL,
  hoverText,
  backupImageURL,
  mainText,
  subText,
  tooltipText,
  roundednessClassName,
}) => {
  const actorSquareMode = useAtomValue(actorSquareModeAtom);

  return (
    <>
      <ImageSquare
        imageURL={imageURL}
        hoverText={hoverText}
        backupImageURL={backupImageURL}
        roundednessClassName={roundednessClassName}
        invisible={actorSquareMode !== ActorSquareMode.PHOTO}
      />
      <TextSquare
        mainText={mainText}
        subText={subText}
        tooltipText={tooltipText}
        invisible={actorSquareMode !== ActorSquareMode.NAME}
      />
    </>
  );
};

export default ToggleableImageSquare;
