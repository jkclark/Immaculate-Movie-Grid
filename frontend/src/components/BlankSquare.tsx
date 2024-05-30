import React from "react";

interface BlankSquareProps {
  clickHandler?: (event: React.MouseEvent) => void;
  isHighlighted?: boolean;
}

const BlankSquare: React.FC<BlankSquareProps> = ({ clickHandler, isHighlighted }) => {
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (clickHandler) {
      clickHandler(event);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`w-full h-full ${isHighlighted ? "bg-sky-100" : "hover:bg-sky-100"} ${clickHandler ? "hover:cursor-pointer" : "hover:cursor-default"}`}
    ></div>
  );
};

export default BlankSquare;
