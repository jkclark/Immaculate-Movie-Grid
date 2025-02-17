export interface TextSquareProps {
  mainText: string;
  subText?: string;
  clickHandler?: (event: React.MouseEvent) => void;
  invisible?: boolean;
}

const TextSquare: React.FC<TextSquareProps> = ({ mainText, subText, clickHandler, invisible }) => {
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (clickHandler) {
      clickHandler(event);
    }
  };

  return (
    <div
      onClick={handleClick}
      // NOTE: relative necessary for z-index so "gradient" can appear behind text
      className={`relative w-full h-full text-center flex flex-col item-center justify-center z-10 theme-text ${invisible ? "hidden" : ""}`}
    >
      <p className="text-md sm:text-xl md:text-3xl lg:text-4xl">{mainText}</p>
      {subText && <p className="text-md sm:text:lg md:text-xl lg:text-2xl">{subText}</p>}
    </div>
  );
};

export default TextSquare;
