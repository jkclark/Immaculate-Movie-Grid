import { useAtomValue } from "jotai";
import React from "react";
import { gameOverAtom, selectedColAtom, selectedRowAtom } from "../state";

interface EmptyGameSquare {
  row: number;
  col: number;
  clickHandler?: (event: React.MouseEvent) => void;
  roundedCornerClassName?: string;
}

const EmptyGameSquare: React.FC<EmptyGameSquare> = ({ row, col, clickHandler, roundedCornerClassName }) => {
  const gameOver = useAtomValue(gameOverAtom);
  const selectedRow = useAtomValue(selectedRowAtom);
  const selectedCol = useAtomValue(selectedColAtom);

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (clickHandler) {
      clickHandler(event);
    }
  };

  return (
    <div
      onClick={gameOver ? undefined : handleClick}
      className={`
        w-full
        h-full
        ${roundedCornerClassName}
        ${row === selectedRow && col === selectedCol && "bg-sky-100"}
        ${!gameOver && !(row == 0 && col == 0) ? "hover:bg-theme-light-accent dark:hover:bg-them-dark-accent" : ""}
      `}
    ></div>
  );
};

export default EmptyGameSquare;
