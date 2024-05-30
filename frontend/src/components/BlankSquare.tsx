import React, { useEffect, useState } from "react";

interface BlankSquareProps {
  clickHandler?: (event: React.MouseEvent) => void;
}

const BlankSquare: React.FC<BlankSquareProps> = ({ clickHandler }) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsClicked(true);
    if (clickHandler) {
      clickHandler(event);
    }
  };

  // This is a bit jank, but it works. We want to highlight this square when a user clicks on it,
  // and then when they click anywhere else (but the event isn't stopped from propagating),
  // we want to unhighlight it.
  //
  // I had previously linked the highlighted-ness to the selectedRow and selectedCol state in GameLogic.tsx,
  // but that means elevating those states to App.tsx, which isn't where I want it.
  useEffect(() => {
    const handleGlobalClick = () => {
      setIsClicked(false);
    };

    window.addEventListener("click", handleGlobalClick);

    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  return (
    <div
      onClick={handleClick}
      className={`w-full h-full ${isClicked ? "bg-sky-100" : "hover:bg-sky-100"} ${clickHandler ? "hover:cursor-pointer" : "hover:cursor-default"}`}
    ></div>
  );
};

export default BlankSquare;
