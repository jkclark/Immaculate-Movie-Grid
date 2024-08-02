interface TextSquareProps {
  mainText: string;
  subText?: string;
  clickHandler?: (event: React.MouseEvent) => void;
}

const TextSquare: React.FC<TextSquareProps> = ({ mainText, subText, clickHandler }) => {
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (clickHandler) {
      clickHandler(event);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="w-full h-full cursor-default text-center flex flex-col item-center justify-center"
    >
      <p className="text-7xl hover:cursor-default">{mainText}</p>
      {subText && <p className="text-xl">{subText}</p>}
    </div>
  );
};

export default TextSquare;
