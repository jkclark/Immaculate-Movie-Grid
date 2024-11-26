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

  const smallScreenTextClasses = [
    "text-xs",
    "text-sm",
    "text-base",
    "text-lg",
    "text-xl",
    "text-2xl",
    "text-3xl",
  ];

  const largeScreenTextClasses = [
    "text-xl",
    "text-2xl",
    "text-3xl",
    "text-4xl",
    "text-5xl",
    "text-6xl",
    "text-7xl",
  ];

  function getTextClassForString(text: string, textClasses: string[], baseIndex: number): string {
    const textLength = text.length;
    // This is just the (very basic) forula we're using for now to determine the offset
    const offset = Math.floor(textLength / 2);
    const textClassIndex = Math.max(baseIndex - offset, 0);
    return textClasses[textClassIndex];
  }

  const smallScreenMainTextClass = getTextClassForString(
    mainText,
    smallScreenTextClasses,
    smallScreenTextClasses.length - 1
  );

  const largeScreenMainTextClass = getTextClassForString(
    mainText,
    largeScreenTextClasses,
    largeScreenTextClasses.length - 1
  );

  let responsiveMainTextClass = `${smallScreenMainTextClass} sm:${largeScreenMainTextClass}`;

  return (
    <div
      onClick={handleClick}
      className="w-full h-full cursor-default text-center flex flex-col item-center justify-center"
    >
      <p className={`${responsiveMainTextClass} hover:cursor-default`}>{mainText}</p>
      {subText && <p className="text-xl">{subText}</p>}
    </div>
  );
};

export default TextSquare;
