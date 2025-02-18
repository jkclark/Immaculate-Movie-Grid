export interface TextSquareProps {
  mainText: string;
  subText?: string;
  hoverText?: string;
  clickHandler?: (event: React.MouseEvent) => void;
  invisible?: boolean;
}

const TextSquare: React.FC<TextSquareProps> = ({ mainText, subText, hoverText, clickHandler, invisible }) => {
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
      className={`relative w-full h-full text-center flex flex-col item-center justify-center z-10 theme-text ${invisible ? "hidden" : ""} group`}
    >
      <p className="text-md sm:text-xl md:text-3xl lg:text-4xl">{mainText}</p>
      {subText && <p className="text-md sm:text:lg md:text-xl lg:text-2xl">{subText}</p>}
      {hoverText && (
        <div className="absolute top-0 left-0 invisible group-hover:visible w-full flex items-center justify-center">
          <div className="relative">
            <div className="bg-theme-primary border-2 border-theme-light-secondary dark:border-theme-dark-secondary py-1 px-2 theme-text rounded-lg">
              {hoverText}
            </div>
            {/* Small down arrow on tooltip */}
            {/* They are the same size triangle, one is 1 pixel above the other
            and the colors are set to make it appear like a border around the
            bottom 2 sides of the triangle */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-theme-light-secondary dark:border-t-theme-dark-secondary"></div>
            <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-theme-light-primary dark:border-t-theme-dark-primary"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextSquare;
