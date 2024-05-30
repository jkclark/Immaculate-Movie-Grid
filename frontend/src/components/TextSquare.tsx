interface TextSquareProps {
  mainText: string;
  subText?: string;
}

const TextSquare: React.FC<TextSquareProps> = ({
  mainText,
  subText,
}) => {
  return (
    <div className="w-full h-full cursor-default text-center flex flex-col item-center justify-center">
      <p className="text-7xl hover:cursor-default">{mainText}</p>
      {subText && <p className="text-xl">{subText}</p>}
    </div >
  );
}

export default TextSquare;
