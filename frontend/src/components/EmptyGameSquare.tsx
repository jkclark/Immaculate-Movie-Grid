import React from "react";

interface EmptyGameSquare {
  clickHandler?: (event: React.MouseEvent) => void;
  isHighlighted?: boolean;
  gameOver: boolean;
}

const EmptyGameSquare: React.FC<EmptyGameSquare> = ({ clickHandler, isHighlighted, gameOver }) => {
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (clickHandler) {
      clickHandler(event);
    }
  };

  return (
    <div
      onClick={gameOver ? undefined : handleClick}
      className={`w-full h-full ${isHighlighted && "bg-sky-100"} ${!gameOver ? "hover:bg-sky-100 hover:cursor-pointer" : "hover:cursor-default"}`}
    ></div>
  );
};

export default EmptyGameSquare;
