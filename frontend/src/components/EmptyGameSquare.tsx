import { useAtomValue } from "jotai";
import React from "react";
import { gameOverAtom, selectedColAtom, selectedRowAtom } from "../state";

interface EmptyGameSquare {
  row: number;
  col: number;
  clickHandler?: (event: React.MouseEvent) => void;
}

const EmptyGameSquare: React.FC<EmptyGameSquare> = ({ row, col, clickHandler }) => {
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
      className={`w-full h-full ${row === selectedRow && col === selectedCol && "bg-sky-100"} ${!gameOver ? "hover:bg-theme-light-accent dark:hover:bg-them-dark-accent" : ""}`}
    ></div>
  );
};

export default EmptyGameSquare;
