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

  const mainTextLength = mainText.length;
  const mainTextClassSize = 7 - Math.floor(mainTextLength / 5);
  let mainTextClass = `text-${mainTextClassSize}xl`;
  // The smallest font size utility with a number is text-2xl
  if (mainTextClassSize <= 1) {
    mainTextClass = "text-xl";
  }

  return (
    <div
      onClick={handleClick}
      className="w-full h-full cursor-default text-center flex flex-col item-center justify-center"
    >
      <p className={`${mainTextClass} hover:cursor-default`}>{mainText}</p>
      {subText && <p className="text-xl">{subText}</p>}
    </div>
  );
};

export default TextSquare;
