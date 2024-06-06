import { useAtom } from "jotai";
import React from "react";
import { gameOverAtom, selectedRowAtom } from "../state/GameState";

interface EmptyGameSquare {
  row: number;
  col: number;
  clickHandler?: (event: React.MouseEvent) => void;
}

const EmptyGameSquare: React.FC<EmptyGameSquare> = ({ row, col, clickHandler }) => {
  const gameOver = useAtom(gameOverAtom)[0];
  const selectedRow = useAtom(selectedRowAtom)[0];
  const selectedCol = useAtom(selectedRowAtom)[0];

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (clickHandler) {
      clickHandler(event);
    }
  };

  return (
    <div
      onClick={gameOver ? undefined : handleClick}
      className={`w-full h-full ${row === selectedRow && col === selectedCol && "bg-sky-100"} ${!gameOver ? "hover:bg-sky-100 hover:cursor-pointer" : "hover:cursor-default"}`}
    ></div>
  );
};

export default EmptyGameSquare;
