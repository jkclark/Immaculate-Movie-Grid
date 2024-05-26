import React, { useState } from 'react';

interface SquareProps {
  row: number;
  col: number;
  text: string;
  imageURL: string;
  div?: JSX.Element;
  setSelectedRow: (row: number) => void;
  setSelectedCol: (col: number) => void;
}

const Square: React.FC<SquareProps> = ({
  row,
  col,
  text,
  imageURL,
  div,
  setSelectedRow,
  setSelectedCol,
}) => {
  const [isTextVisible, setIsTextVisible] = useState(false);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleClick = (event: React.MouseEvent) => {
    // Necessary to prevent the page's click handler from resetting this state
    event.stopPropagation();
    if (isMobile && imageURL) {
      setIsTextVisible(!isTextVisible);
      if (!isTextVisible) {
        setSelectedRow(row);
        setSelectedCol(col);
      }
    } else {
      setSelectedRow(row);
      setSelectedCol(col);
    }
  };

  return (
    <div onClick={handleClick} className="w-full h-full aspect-[2/3] flex items-center justify-center relative group">
      {div && div}
      {!div && imageURL && <img src={imageURL} alt={text} className="h-full" />}
      {(!div && text &&
        <>
          <div className={`absolute inset-0 bg-black ${isMobile ? (isTextVisible ? 'opacity-50' : 'opacity-0') : 'opacity-0 group-hover:opacity-50'} transition-opacity duration-100`}></div>
          <div className={`absolute inset-0 flex items-center justify-center text-center ${isMobile ? (isTextVisible ? 'opacity-100' : 'opacity-0') : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-100`}>
            <p className="text-white hover:cursor-default">{text}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Square;
