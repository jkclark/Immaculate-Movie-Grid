import React from "react";

interface BlankSquareProps {
  clickHandler?: (event: React.MouseEvent) => void;
}

const BlankSquare: React.FC<BlankSquareProps> = ({
  clickHandler,
}) => {
  return (
    <div onClick={clickHandler} className={`w-full h-full hover:bg-sky-100 ${clickHandler ? "hover:cursor-pointer" : "hover:cursor-default"}`}></div>
  );
}

export default BlankSquare;
